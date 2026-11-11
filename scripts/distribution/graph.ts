import { dirname, posix } from 'node:path';
import ts from 'typescript-compiler-api';
import { z } from 'zod';
import { digestSchema } from '../../src/distribution/schema.ts';
import { relativeDistributionPathSchema } from '../../src/distribution/content.ts';
import { DistributionError, sha256 } from './integrity.ts';
import { readSafeFile } from './files.ts';

export const reviewedModuleSchema = z
  .strictObject({
    path: relativeDistributionPathSchema,
    sha256: digestSchema,
    dependencies: z
      .record(
        z.string(),
        z.union([
          z.strictObject({ kind: z.literal('file'), path: relativeDistributionPathSchema }),
          z.strictObject({
            kind: z.literal('package'),
            name: z.string(),
            requires: z.array(z.string()).min(1),
          }),
        ]),
      )
      .readonly(),
    links: z.array(relativeDistributionPathSchema).readonly(),
  })
  .readonly();
export type ReviewedModule = z.infer<typeof reviewedModuleSchema>;

const forbiddenSegments = new Set([
  'node_modules',
  '.git',
  '.codex',
  '.agents',
  'archives',
  'snapshots',
  'history',
  'evidence',
]);
export function assertCustomerFilePath(file: string): void {
  relativeDistributionPathSchema.parse(file);
  if (
    file.split('/').some((part) => forbiddenSegments.has(part)) ||
    /(?:distribution-manifest|knowledge\.generated|provided-manifest|owp-distribution\.config|\.env|\.map$)/i.test(
      file,
    )
  )
    throw new DistributionError('forbidden-file', '고객 자료로 허용되지 않은 파일입니다.');
}

function codeDependencies(file: string, content: string): readonly string[] {
  const extension = file.toLowerCase();
  const program = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    extension.endsWith('.tsx')
      ? ts.ScriptKind.TSX
      : extension.endsWith('.jsx')
        ? ts.ScriptKind.JSX
        : ts.ScriptKind.TS,
  );
  const imports = new Set<string>();
  function visit(node: ts.Node): void {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      if (!ts.isStringLiteral(node.moduleSpecifier))
        throw new DistributionError(
          'dynamic-dependency',
          '동적 module specifier를 허용하지 않습니다.',
        );
      imports.add(node.moduleSpecifier.text);
    }
    if (ts.isImportEqualsDeclaration(node))
      throw new DistributionError('dynamic-dependency', 'import equals는 별도 검토가 필요합니다.');
    if (ts.isImportTypeNode(node)) {
      if (!ts.isLiteralTypeNode(node.argument) || !ts.isStringLiteral(node.argument.literal))
        throw new DistributionError('dynamic-dependency', '동적 type import를 허용하지 않습니다.');
      imports.add(node.argument.literal.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          ['require', 'fetch', 'eval', 'Function'].includes(node.expression.text)) ||
        (ts.isPropertyAccessExpression(node.expression) &&
          ['glob', 'globEager'].includes(node.expression.name.text)))
    )
      throw new DistributionError(
        'dynamic-dependency',
        '동적 import·loader·network 의존성은 별도 격리 검토가 필요합니다.',
      );
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['URL', 'Worker', 'SharedWorker', 'Function'].includes(node.expression.text)
    )
      throw new DistributionError(
        'dynamic-dependency',
        '동적으로 생성되는 리소스는 허용하지 않습니다.',
      );
    ts.forEachChild(node, visit);
  }
  visit(program);
  return [...imports].sort();
}

/** 제한된 inline 문법만 처리합니다. 전체 Markdown parser로 사용하지 않습니다. */
function markdownTargets(content: string): readonly string[] {
  if (
    /^\s{0,3}\[[^\]]+\]:/m.test(content) ||
    /\]\s*\[[^\]]*\]/.test(content) ||
    /<(?:[a-z][\w+.-]*:|\/\/|\/(?![a-z][\w:-]*\s*>))/i.test(content)
  )
    throw new DistributionError(
      'unsupported-markdown-link',
      '참조형·자동 링크는 지원하지 않습니다.',
    );
  const targets: string[] = [];
  const inline =
    /^\]\([ \t]*(?:<([^<>\s]+)>|([^\s()<>]+))(?:[ \t]+(?:"[^"\r\n]*"|'[^'\r\n]*'))?[ \t]*\)/;
  for (const candidate of content.matchAll(/\]\s*\(/g)) {
    const match = inline.exec(content.slice(candidate.index));
    const target = match?.[1] ?? match?.[2];
    if (!match || !target)
      throw new DistributionError(
        'unsupported-markdown-link',
        '지원하지 않는 inline 링크 문법입니다.',
      );
    targets.push(target);
  }
  return targets;
}

/** CSS escape·동적 함수·조건부 import는 해석하지 않고 거부합니다. */
export function cssTargets(content: string): readonly string[] {
  if (/\\|\/\*|image-set\s*\(|(?:image|src)\s*\(/i.test(content))
    throw new DistributionError(
      'unsupported-css-link',
      'CSS escape·comment·동적 asset 문법은 지원하지 않습니다.',
    );
  const targets: string[] = [];
  const url = /^url\(\s*(?:"([^"\r\n]+)"|'([^'\r\n]+)'|([^\s()'";]+))\s*\)/i;
  for (const candidate of content.matchAll(/url\s*\(/gi)) {
    const match = url.exec(content.slice(candidate.index));
    const target = match?.[1] ?? match?.[2] ?? match?.[3];
    if (!match || !target)
      throw new DistributionError('unsupported-css-link', '정적 CSS url()만 지원합니다.');
    targets.push(target);
  }
  const imported =
    /^@import\s+(?:url\(\s*(?:"[^"\r\n]+"|'[^'\r\n]+'|[^\s()'";]+)\s*\)|"([^"\r\n]+)"|'([^'\r\n]+)')\s*;/i;
  for (const candidate of content.matchAll(/@import\b/gi)) {
    const match = imported.exec(content.slice(candidate.index));
    if (!match)
      throw new DistributionError('unsupported-css-link', '정적 CSS import만 지원합니다.');
    const target = match[1] ?? match[2];
    if (target) targets.push(target);
  }
  return targets;
}

export function relativeMaterialTarget(file: string, target: string): string | undefined {
  if (target.startsWith('#')) return undefined;
  if (
    /^(?:[a-z][\w+.-]*:|\/\/|\/)/i.test(target) ||
    /[?%\\]/.test(target) ||
    target.split('/').includes('..')
  )
    throw new DistributionError(
      'external-link',
      '자료 링크는 포함된 root 내부 상대 파일만 가리켜야 합니다.',
    );
  const path = target.split('#')[0];
  if (!path) throw new DistributionError('external-link', '정적 상대 파일 경로가 필요합니다.');
  const resolved = posix.normalize(posix.join(dirname(file), path));
  assertCustomerFilePath(resolved);
  return resolved;
}

/** 정적 quoted href·src만 해석하며 entity·다른 resource 속성은 별도 검토로 남깁니다. */
function htmlTargets(file: string, content: string): readonly string[] {
  const targets: string[] = [];
  const unsupported = new Set([
    'srcset',
    'imagesrcset',
    'poster',
    'data',
    'action',
    'formaction',
    'background',
    'ping',
    'manifest',
    'codebase',
    'archive',
    'profile',
    'longdesc',
    'usemap',
    'cite',
    'icon',
    'xlink:href',
    'xlinkhref',
    'xml:base',
    'xmlbase',
    'lowsrc',
    'dynsrc',
    'classid',
    'code',
    'style',
    'srcdoc',
    'content',
    'http-equiv',
    'httpequiv',
    'attributionsrc',
    'datasrc',
    'fill',
    'stroke',
    'filter',
    'clip-path',
    'clippath',
    'mask',
    'marker-start',
    'markerstart',
    'marker-mid',
    'markermid',
    'marker-end',
    'markerend',
    'cursor',
    'color-profile',
    'colorprofile',
  ]);
  function attribute(name: string, value: string | undefined): void {
    const key = name.toLowerCase();
    if (unsupported.has(key))
      throw new DistributionError('unsupported-html-link', '지원하지 않는 resource 속성입니다.');
    if (key !== 'href' && key !== 'src') return;
    if (value === undefined || !value || /[&{}]/.test(value))
      throw new DistributionError(
        'unsupported-html-link',
        'entity·동적 표현이 없는 정적 quoted href·src만 지원합니다.',
      );
    targets.push(value);
  }
  if (/\.[jt]sx$/i.test(file)) {
    const source = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function visit(node: ts.Node): void {
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        node.tagName.getText(source).toLowerCase() === 'base'
      )
        throw new DistributionError(
          'unsupported-html-link',
          '상대 URL 기준을 바꾸는 base는 지원하지 않습니다.',
        );
      if (ts.isJsxSpreadAttribute(node))
        throw new DistributionError(
          'unsupported-html-link',
          'JSX spread 속성은 별도 검토가 필요합니다.',
        );
      if (ts.isJsxAttribute(node)) {
        const initializer = node.initializer;
        const value =
          initializer &&
          ts.isStringLiteral(initializer) &&
          /^(["'])[\s\S]*\1$/.test(initializer.getText(source))
            ? initializer.text
            : undefined;
        attribute(node.name.getText(source), value);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    return targets;
  }
  let end = 0;
  for (const candidate of content.matchAll(/<\/?[a-z][\w:.-]*(?=[\s/>]|$)/gi)) {
    if (candidate.index < end) continue;
    if (/^<\/?base$/i.test(candidate[0]))
      throw new DistributionError(
        'unsupported-html-link',
        '상대 URL 기준을 바꾸는 base는 지원하지 않습니다.',
      );
    let offset = candidate.index + candidate[0].length;
    const closing = candidate[0].startsWith('</');
    while (true) {
      const remaining = content.slice(offset);
      const finish = /^\s*\/?>/.exec(remaining);
      if (finish) {
        end = offset + finish[0].length;
        break;
      }
      const match = /^\s+([^\s=<>/"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/.exec(remaining);
      if (!match || closing)
        throw new DistributionError(
          'unsupported-html-link',
          'HTML 속성은 정적 quoted 값 또는 resource가 아닌 boolean 속성만 지원합니다.',
        );
      const name = match[1] ?? '';
      if (!/^[A-Za-z_:][A-Za-z0-9_.:-]*$/.test(name))
        throw new DistributionError(
          'unsupported-html-link',
          'HTML spread·동적 속성은 지원하지 않습니다.',
        );
      attribute(name, match[2] ?? match[3]);
      offset += match[0].length;
    }
  }
  return targets;
}

function materialLinks(file: string, content: string): readonly string[] {
  const found = new Set<string>();
  if (/\.(?:md|html|css|tsx|jsx)$/i.test(file)) {
    const targets = /\.css$/i.test(file)
      ? [...cssTargets(content)]
      : [...htmlTargets(file, content)];
    if (/\.md$/i.test(file)) targets.push(...markdownTargets(content));
    for (const target of targets) {
      const resolved = relativeMaterialTarget(file, target);
      if (resolved) found.add(resolved);
    }
  }
  return [...found].sort();
}

export function validateIncludedGraph(input: {
  readonly root: string;
  readonly readFile?: (file: string) => Buffer;
  readonly includedFiles: readonly string[];
  readonly modules: readonly ReviewedModule[];
  readonly packageNames: readonly string[];
  readonly externalPackages: readonly string[];
  readonly grantedCapabilities: readonly string[];
}): ReadonlyMap<string, Buffer> {
  const included = new Set(input.includedFiles);
  const modules = new Map(input.modules.map((entry) => [entry.path, entry]));
  if (
    included.size !== input.includedFiles.length ||
    modules.size !== input.modules.length ||
    modules.size !== included.size ||
    [...modules.keys()].some((file) => !included.has(file))
  )
    throw new DistributionError(
      'graph-inventory-mismatch',
      '포함 파일과 검토된 module graph 목록이 다릅니다.',
    );
  const contents = new Map<string, Buffer>();
  for (const file of included) {
    assertCustomerFilePath(file);
    const module = modules.get(file);
    if (!module) throw new DistributionError('module-unreviewed', '검토된 module이 없습니다.');
    const bytes = input.readFile ? input.readFile(file) : readSafeFile(input.root, file);
    if (sha256(bytes) !== module.sha256)
      throw new DistributionError('module-digest-mismatch', '검토 후 파일이 변경되었습니다.');
    const content = bytes.toString('utf8');
    const actual = /\.[cm]?[jt]sx?$/i.test(file) ? codeDependencies(file, content) : [];
    if (actual.join('\n') !== Object.keys(module.dependencies).sort().join('\n'))
      throw new DistributionError(
        'module-dependencies-mismatch',
        '실제 import와 검토된 의존성 목록이 다릅니다.',
      );
    for (const [specifier, dependency] of Object.entries(module.dependencies)) {
      if (
        specifier.includes('\\') ||
        specifier.startsWith('/') ||
        specifier.includes(':') ||
        /[?#]/.test(specifier) ||
        specifier.includes('\0')
      )
        throw new DistributionError(
          'module-path-forbidden',
          'module 경로에 절대 경로·protocol·query를 사용할 수 없습니다.',
        );
      if (dependency.kind === 'file') {
        const direct = posix.normalize(posix.join(dirname(file), specifier));
        assertCustomerFilePath(direct);
        if (
          !/^(?:\.\/|\.\.\/)/.test(specifier) ||
          !included.has(dependency.path) ||
          ![
            direct,
            `${direct}.ts`,
            `${direct}.tsx`,
            `${direct}.js`,
            `${direct}.jsx`,
            `${direct}/index.ts`,
            `${direct}/index.tsx`,
          ].includes(dependency.path)
        )
          throw new DistributionError(
            'excluded-module',
            'module 의존성이 포함된 파일과 일치하지 않습니다.',
          );
        // 실제 대상도 source root 내부 일반 파일이어야 하며 symlink는 허용하지 않습니다.
        if (!input.readFile) readSafeFile(input.root, dependency.path);
      } else {
        const packageName = specifier
          .split('/')
          .slice(0, specifier.startsWith('@') ? 2 : 1)
          .join('/');
        if (
          specifier.startsWith('.') ||
          specifier.split('/').some((part) => part === '..' || part === '') ||
          packageName !== dependency.name ||
          !(packageName.startsWith('@owp/') ? input.packageNames : input.externalPackages).includes(
            packageName,
          ) ||
          dependency.requires.some((capability) => !input.grantedCapabilities.includes(capability))
        )
          throw new DistributionError(
            'excluded-package-module',
            'package import와 개별 capability의 허용을 확인하세요.',
          );
      }
    }
    const links = materialLinks(file, content);
    if (
      links.join('\n') !== [...module.links].sort().join('\n') ||
      links.some((target) => !included.has(target))
    )
      throw new DistributionError(
        'excluded-link',
        '링크가 포함되지 않았거나 검토되지 않은 파일을 가리킵니다.',
      );
    contents.set(file, bytes);
  }
  return contents;
}

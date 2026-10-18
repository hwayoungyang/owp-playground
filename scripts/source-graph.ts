import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseSync, type Plugin } from 'vite';

const moduleId = 'virtual:playground-source-graph';
const resolvedId = `\0${moduleId}`;

/** 실행 소스의 상대 import 관계를 개발·빌드 단계에서 계산합니다. */
export function sourceGraphPlugin(): Plugin {
  let root = '';
  return {
    name: 'playground-source-graph',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (id === moduleId) return resolvedId;
    },
    async load(id) {
      if (id !== resolvedId) return;
      const directory = path.join(root, 'src');
      const files = (await readdir(directory, { recursive: true })).filter(
        (file) => /\.(?:ts|tsx)$/.test(file) && !file.endsWith('.d.ts'),
      );
      const known = new Set(files);
      const entries = await Promise.all(
        files.map(async (file) => {
          const absolute = path.join(directory, file);
          this.addWatchFile(absolute);
          const parsed = parseSync(file, await readFile(absolute, 'utf8'));
          const imports = parsed.program.body.flatMap((node) => {
            if (node.type !== 'ImportDeclaration' || node.importKind === 'type') return [];
            if (
              node.specifiers.length > 0 &&
              node.specifiers.every(
                (specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type',
              )
            ) return [];
            const specifier = node.source.value;
            if (!specifier.startsWith('.')) return [];
            const base = path.posix.normalize(
              path.posix.join(path.posix.dirname(file), specifier.split('?')[0] ?? specifier),
            );
            const dependency = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find(
              (candidate) => known.has(candidate),
            );
            return dependency ? [`/src/${dependency}`] : [];
          });
          return [`/src/${file}`, imports] as const;
        }),
      );
      return `export default ${JSON.stringify(Object.fromEntries(entries))};`;
    },
    handleHotUpdate(context) {
      const graph = context.server.moduleGraph.getModuleById(resolvedId);
      if (graph && /\.(?:ts|tsx)$/.test(context.file)) {
        context.server.moduleGraph.invalidateModule(graph);
        return [...context.modules, graph];
      }
    },
  };
}

import { parseSync, Visitor } from 'vite';

const core = '@owp/core';
const components = '@owp/components';

/** Core adapter로도 사용할 수 있는 샘플을 명시합니다. Components 조합은 별도로 검사합니다. */
export const coreSampleAdapters = {
  'examples/app-settings.tsx': {
    OwpTable: 'Core settings의 table·dataGrid 설정 연결',
    OwpFieldTable: 'Core settings와 Date Picker formatter 연결',
  },
  'examples/dialog.tsx': { OwpDialog: 'dialog stack과 미저장 변경 확인' },
  'examples/page-carded.tsx': {
    OwpPageCarded: '페이지 이탈 보호와 스크롤',
    OwpPageContent: 'Core 반응형 페이지 스타일',
    OwpSearchFilter: '검색 진행 정책 연결',
  },
  'examples/page-content.tsx': { OwpPageContent: 'Core 반응형 페이지 스타일' },
  'examples/search-filter.tsx': { OwpSearchFilter: 'query 진행 추적과 취소' },
  'examples/error-boundary.tsx': { OwpErrorBoundary: 'Core 오류 복구 정책' },
  'guides/getting-started.tsx': {
    OwpErrorBoundary: '앱 오류 복구 정책',
    OwpPageCarded: '앱 페이지 정책 연결',
    OwpRouteErrorElement: 'Data Router 오류 복구 정책',
  },
};

const sharedUi = new Set([
  'OwpTable',
  'OwpFieldTable',
  'OwpDialog',
  'OwpPageCarded',
  'OwpPageContent',
  'OwpSearchFilter',
  'OwpErrorBoundary',
]);

const samplePath = (file) =>
  file.replaceAll('\\', '/').match(/(?:^|\/)src\/playgrounds\/core\/(.+)$/)?.[1];

const componentsPolicySamples = {
  'examples/dialog.tsx': ['OwpDialog'],
  'examples/page-carded.tsx': ['OwpPageCarded', 'OwpPageContent'],
  'examples/page-content.tsx': ['OwpPageContent'],
  'examples/error-boundary.tsx': ['OwpErrorBoundary'],
  'guides/getting-started.tsx': ['OwpPageCarded', 'OwpErrorBoundary'],
};

/** 현재 정책 예제에서 Components UI에 필요한 Core 연결만 검사합니다. */
function verifyPolicyComposition({ file, content }) {
  const sampleComponents = componentsPolicySamples[samplePath(file)];
  if (!sampleComponents) return [];
  const parsed = parseSync(file, content);
  if (parsed.errors.length) throw new SyntaxError(`정책 예제 구문을 읽을 수 없습니다: ${file}`);
  const bindings = new Map();
  const policies = new Map();
  const renderedStyles = new Map();
  const elements = [];
  const resolve = (node) => {
    if (node?.type === 'Identifier' || node?.type === 'JSXIdentifier')
      return bindings.get(node.name);
    if (['MemberExpression', 'JSXMemberExpression'].includes(node?.type)) {
      const namespace = bindings.get(node.object.name);
      if (namespace?.name === '*')
        return { ...namespace, name: node.property.name ?? node.property.value };
    }
    return undefined;
  };
  new Visitor({
    ImportDeclaration(node) {
      for (const item of node.specifiers) {
        if (node.importKind === 'type' || item.importKind === 'type') continue;
        bindings.set(item.local.name, {
          specifier: node.source.value,
          name: item.type === 'ImportNamespaceSpecifier' ? '*' : item.imported?.name,
        });
      }
    },
  }).visit(parsed.program);
  new Visitor({
    VariableDeclarator(node) {
      if (node.id.type !== 'Identifier' || node.init?.type !== 'CallExpression') return;
      const hook = resolve(node.init.callee);
      if (
        hook?.specifier === `${core}/hooks` &&
        ['useDialogPolicy', 'usePageCardedPolicy'].includes(hook.name)
      )
        policies.set(node.id.name, hook.name);
    },
    JSXExpressionContainer(node) {
      const expression = node.expression;
      if (
        expression.type === 'MemberExpression' &&
        expression.object.type === 'Identifier' &&
        expression.property.name === 'styles'
      )
        renderedStyles.set(expression.object.name, node.start);
    },
    JSXOpeningElement(node) {
      elements.push(node);
    },
  }).visit(parsed.program);
  const errors = [];
  for (const element of elements) {
    const owner = resolve(element.name);
    if (
      !owner ||
      !sampleComponents.includes(owner.name) ||
      ![core, components].includes(owner.specifier)
    )
      continue;
    const entry = {
      file,
      line: content.slice(0, element.start).split('\n').length,
      specifier: owner.specifier,
      name: owner.name,
      kind: 'policy-composition',
    };
    const fail = (reason) => errors.push({ ...entry, reason });
    const hook = { OwpDialog: 'useDialogPolicy', OwpPageCarded: 'usePageCardedPolicy' }[owner.name];
    const spread = element.attributes.find((attribute) => {
      const value = attribute.argument;
      return (
        attribute.type === 'JSXSpreadAttribute' &&
        value.type === 'MemberExpression' &&
        value.property.name === 'props' &&
        policies.get(value.object.name) === hook
      );
    });
    if (hook) {
      if (owner.specifier === core) {
        if ([...policies.values()].includes(hook)) fail('double-core-policy');
      } else if (!spread) fail('missing-policy-props');
      else {
        const policyName = spread.argument.object.name;
        if (!(renderedStyles.get(policyName) < element.start)) fail('missing-policy-styles');
        const controlled =
          hook === 'useDialogPolicy'
            ? [
                'open',
                'responsiveLayout',
                'confirmation',
                'onRequestClose',
                'preserveCancelFocus',
                'onEntered',
                'stackIndex',
              ]
            : ['scroll', 'fillContentHeight', 'responsiveLayout', 'className', 'slots'];
        if (
          element.attributes.some(
            (attribute) =>
              attribute.start > spread.start &&
              (attribute.type === 'JSXSpreadAttribute' ||
                controlled.includes(attribute.name?.name)),
          )
        )
          fail('overridden-policy-props');
      }
    }
    if (owner.name === 'OwpErrorBoundary') {
      const hasPolicy = element.attributes.some(
        (attribute) =>
          attribute.type === 'JSXSpreadAttribute' &&
          resolve(attribute.argument)?.specifier === `${core}/utils` &&
          resolve(attribute.argument)?.name === 'errorBoundaryPolicy',
      );
      if (owner.specifier === components && !hasPolicy) fail('missing-error-boundary-policy');
      if (owner.specifier === core && hasPolicy) fail('double-core-policy');
    }
    if (owner.name === 'OwpPageContent') {
      const slots = element.attributes.find(
        (attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'slots',
      )?.value?.expression;
      const hasStyleSlot =
        slots?.type === 'ObjectExpression' &&
        slots.properties.some(
          (property) =>
            property.type === 'Property' &&
            (property.key.name ?? property.key.value) === 'responsiveLayoutGlobalStyles' &&
            resolve(property.value)?.specifier === core &&
            resolve(property.value)?.name === 'OwpCoreResponsiveLayoutGlobalStyles',
        );
      if (owner.specifier === components && !hasStyleSlot)
        fail('missing-responsive-layout-style-slot');
      if (owner.specifier === core && hasStyleSlot) fail('double-core-policy');
    }
  }
  return errors;
}

/** Core adapter와 Components UI+Core 정책을 허용하고 보조 UI·타입의 소유권을 검사합니다. */
export function verifyCoreImportPolicy(imports, sources = []) {
  const errors = [];
  for (const entry of imports) {
    const relative = samplePath(entry.file);
    if (!relative || !/^(?:examples|guides)\//.test(relative)) continue;
    const policies = coreSampleAdapters[relative] ?? {};
    for (const symbol of entry.names) {
      let expectedSpecifier;
      if (sharedUi.has(symbol.name) && [core, components].includes(entry.specifier)) {
        expectedSpecifier = Object.hasOwn(policies, symbol.name)
          ? componentsPolicySamples[relative]?.includes(symbol.name)
            ? entry.specifier
            : core
          : components;
      }
      if (
        symbol.name === 'OwpDialogProps' &&
        [`${core}/types`, `${components}/types`].includes(entry.specifier)
      ) {
        const usesCoreDialog = imports.some(
          (candidate) =>
            candidate.file === entry.file &&
            candidate.specifier === core &&
            candidate.names.some((name) => name.name === 'OwpDialog'),
        );
        expectedSpecifier = usesCoreDialog ? `${core}/types` : `${components}/types`;
      }
      if (expectedSpecifier && entry.specifier !== expectedSpecifier) {
        errors.push({
          ...entry,
          name: symbol.name,
          reason: 'wrong-sample-owner',
          expectedSpecifier,
        });
      }
    }
  }
  return [...errors, ...sources.flatMap(verifyPolicyComposition)];
}

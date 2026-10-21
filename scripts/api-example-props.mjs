import { createPropBindings, propKey, walkPropNodes } from './api-example-prop-bindings.mjs';

const sourcePath = (file) => file.replace(/^\/src\//, '');
const member = (node, name) => node?.type === 'MemberExpression' && !node.computed && propKey(node.property) === name;

/** 공개 컴포넌트에 실제 전달된 최상위 prop과 그 AST 위치만 수집합니다. */
export function discoverExamplePropReferences({ packageId, files, records }) {
  const packages = new Set(['@owp/charts', '@owp/datagrid']);
  const byId = records instanceof Map ? records : new Map(records.map((record) => [record.id, record]));
  const bindings = createPropBindings(files);
  const components = new Map([...byId.values()].filter((record) => packages.has(record.package)
    && record.kind === 'component' && record.imports?.length)
    .flatMap((record) => record.imports.map((source) => [`${source}:${record.name}`, record])));
  const fields = new Map();
  for (const record of byId.values()) if (packages.has(record.package) && record.path && !record.path.includes('.')) {
    const ownerId = `${record.package}:${record.owner}`;
    const owner = fields.get(ownerId) ?? new Map();
    owner.set(record.path, record);
    fields.set(ownerId, owner);
  }
  const references = new Map();
  const diagnostics = [];
  function add(record, name, node, module) {
    const line = module.content.slice(0, node.start).split('\n').length;
    const end = node.type === 'Property' ? node.key.end : node.end;
    const location = { file: sourcePath(module.file), line, endLine: Math.min(line + 15, module.content.slice(0, end).split('\n').length), sha256: module.sha256 };
    const candidate = { id: record.id, label: name, packageId: record.package.slice('@owp/'.length), location, codeReview: { method: 'ast' }, priority: module.priority ?? 0 };
    const current = references.get(record.id);
    if (!current || candidate.priority > current.priority
      || (candidate.priority === current.priority && `${location.file}:${line}` < `${current.location.file}:${current.location.line}`)) references.set(record.id, candidate);
  }
  function gridAdapter(node, module) {
    if (packageId !== 'datagrid' || sourcePath(module.file) !== 'playgrounds/datagrid/runtime/GridPreview.tsx') return undefined;
    const value = bindings.bindingFor(node, module)?.node;
    if (!member(value, 'Component') || value.object.type !== 'MemberExpression' || !value.object.computed) return undefined;
    const registry = module.imports.get(propKey(value.object.object));
    if (registry?.name !== 'gridRegistry' || registry.source !== '../model/gridRegistry') return undefined;
    return components.get('@owp/datagrid:OwpDataGrid');
  }
  function componentFor(node, module) {
    const imported = bindings.bindingFor(node, module);
    const component = imported?.source && components.get(`${imported.source}:${imported.name}`);
    return component ?? gridAdapter(node, module);
  }
  function contract(component) {
    const own = `${component.package}:${component.name}Props`;
    if (fields.has(own)) return fields.get(own);
    const related = (component.related ?? []).map((id) => byId.get(id)).find((record) =>
      record && /(?:Props|Input)$/.test(record.owner) && !record.path && fields.has(`${record.package}:${record.owner}`));
    return related ? fields.get(`${related.package}:${related.owner}`) : new Map();
  }
  function configuration() {
    const entry = bindings.modules.filter((module) => module.priority === 100);
    return entry.flatMap((module) => {
      const exported = bindings.exported(module, 'gridConfiguration');
      return exported?.node ? bindings.properties(exported.node, exported.module) : [];
    });
  }
  for (const module of bindings.modules) walkPropNodes(module.program, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    const component = componentFor(node.name, module);
    if (!component) return;
    const props = contract(component);
    const adapter = gridAdapter(node.name, module);
    const consume = (name, property, source) => {
      const record = props.get(name);
      if (record) add(record, name, property, source);
      else if (name === 'ref' && component.id === '@owp/datagrid:OwpDataGrid') {
        const ref = byId.get('@owp/datagrid:OwpDataGridRef');
        if (ref?.imports?.length) add(ref, name, property, source);
        else diagnostics.push({ kind: 'excluded-prop', component: component.name, prop: name, file: sourcePath(source.file) });
      } else if (name !== 'key') diagnostics.push({ kind: 'excluded-prop', component: component.name, prop: name, file: sourcePath(source.file) });
    };
    for (const attribute of node.attributes) {
      if (attribute.type === 'JSXAttribute') consume(propKey(attribute.name), attribute, module);
      else {
        const unresolved = bindings.unresolved.length;
        const isConfiguration = adapter && member(attribute.argument, 'configuration')
          && attribute.argument.object.type === 'Identifier' && attribute.argument.object.name === 'controller';
        const properties = isConfiguration ? configuration() : bindings.properties(attribute.argument, module);
        for (const property of properties) consume(property.name, property.node, property.module);
        if (bindings.unresolved.length > unresolved || (isConfiguration && !properties.length)) diagnostics.push({ kind: 'unresolved-spread', component: component.name, file: sourcePath(module.file), line: module.content.slice(0, attribute.start).split('\n').length });
      }
    }
  });
  return {
    references: [...references.values()].sort((a, b) => a.id.localeCompare(b.id)).map(({ priority: _priority, ...reference }) => reference),
    diagnostics,
  };
}

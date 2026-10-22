import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { access, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { guides } from '../knowledge/guides.mjs';
import { guideSections } from '../knowledge/guide-sections.mjs';
import { gridCatalog } from '../src/playgrounds/datagrid/catalog.ts';
import { chartExecutionCatalog } from '../src/playgrounds/charts/catalog.ts';
import { readDeclarations } from './api-declarations.mjs';
import { resolveExampleReferences } from './api-references.mjs';
import { inheritApiMembers } from './api-inheritance.mjs';
import { auditKnowledgeSources } from './audit-knowledge-sources.mjs';
import { parseDocumentation } from './api-documentation.mjs';
import { describeApiTypes } from './api-type-details.mjs';
import { readSourceResources, sourceDependencyGraph } from './source-resources.ts';
import { groupExampleSources } from '../src/features/code/source-groups.ts';
import { getGridSourcePolicy } from '../src/playgrounds/datagrid/model/sourceFiles.ts';
import { chartSourcePolicy } from '../src/playgrounds/charts/model/sourceFiles.ts';
import { createExampleCodeReviews } from './api-example-reviews.mjs';
import { discoverExamplePropReferences } from './api-example-props.mjs';
import { exampleCodeHref } from '../src/features/code/code-location.ts';
import { toReferenceStyle } from '../knowledge/korean-copy.mjs';
import { compareApiMembers } from '../src/features/api/model/presentation.ts';
import { apiRecordReferenceIds, createPackageKnowledge } from '../src/features/api/model/package-data.ts';
import { knowledgeSchema, packageKnowledgeSchema } from '../src/features/api/model/schema.ts';

const root = path.resolve(import.meta.dirname, '..');
const hash = (content) => createHash('sha256').update(content).digest('hex');
const catalogs = { datagrid: gridCatalog, charts: chartExecutionCatalog };
const externalPackages = ['chart.js', 'react-chartjs-2', 'chartjs-plugin-annotation', 'chartjs-plugin-datalabels'];
const own = await Promise.all(['datagrid', 'charts'].map((id) => readDeclarations(path.join(root, `node_modules/@owp/${id}`), { externalPackages })));
const require = createRequire(await realpath(path.join(root, 'node_modules/@owp/charts/package.json')));
const dependencies = await Promise.all(externalPackages.map((name) => readDeclarations(path.resolve(require.resolve(name), '../..'), {
  externalPackages,
  additionalEntries: name === 'chartjs-plugin-datalabels' ? { './types/options': { types: './types/options.d.ts' } } : {},
})));
const native = dependencies[0];
const reviewed = JSON.parse(await readFile(path.join(root, 'knowledge/reviewed-packages.json'), 'utf8'));
for (const [index, packageId] of ['datagrid', 'charts'].entries()) {
  const current = own[index];
  const previous = reviewed[`@owp/${packageId}`];
  if (!previous || previous.version !== current.version || previous.declarationHash !== current.declarationHash || previous.runtimeHash !== current.runtimeHash) throw new Error(`패키지 계약이 검토한 버전과 다릅니다: @owp/${packageId}. API·가이드·명칭을 대조한 뒤 reviewed-packages.json을 갱신하세요.`);
}
for (const [index, name] of externalPackages.entries()) {
  const current = dependencies[index];
  const previous = reviewed[name];
  if (!previous || previous.version !== current.version || previous.declarationHash !== current.declarationHash || previous.runtimeHash !== current.runtimeHash) throw new Error(`외부 API 계약을 다시 검토하세요: ${name}`);
}
const sourceAudit = JSON.parse(await readFile(path.join(root, 'knowledge/source-audit.json'), 'utf8'));
const sourceRoots = {
  agents: process.env.OWP_KNOWLEDGE_AGENTS_ROOT ?? path.resolve(root, '../../agents'),
  framework: process.env.OWP_KNOWLEDGE_FRAMEWORK_ROOT ?? path.resolve(root, '../owp-framework'),
};
let sourcesAvailable = true;
try {
  await Promise.all(Object.values(sourceRoots).map((directory) => access(directory)));
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 'ENOENT') sourcesAvailable = false;
  else throw error;
}
if (sourcesAvailable && !isDeepStrictEqual(await auditKnowledgeSources(sourceRoots), sourceAudit)) throw new Error('스킬·문서 원본이 검토본과 다릅니다. 삭제·이름·계약을 대조하고 source-audit.json을 갱신하세요.');
const allRecords = describeApiTypes(inheritApiMembers([...own, ...dependencies].flatMap((result) => result.records)), [...own, ...dependencies].flatMap((result) => result.augmentations));
const examples = [];
for (const packageId of ['datagrid', 'charts']) {
  const sourceText = new Map(await Promise.all(catalogs[packageId].map(async (entry) => [entry.id, await readFile(path.join(root, `src/playgrounds/${packageId}/${entry.source}`), 'utf8')])));
  examples.push(...resolveExampleReferences({ packageId, examples: catalogs[packageId], records: allRecords, sourceText }).map((entry) => ({ ...entry, url: `/?${new URLSearchParams({ package: packageId, sample: entry.id })}`, entrypoint: `/snippets/playgrounds/${packageId}/${entry.source}`, sha256: hash(sourceText.get(entry.id)) })));
}
const byId = new Map(allRecords.map((entry) => [entry.id, entry]));
const resources = await readSourceResources(root);
const graph = sourceDependencyGraph(resources);
const codeReviews = createExampleCodeReviews(
  Object.fromEntries(await Promise.all(['datagrid', 'charts'].map(async (id) => [id, JSON.parse(await readFile(path.join(root, `knowledge/example-code-reviews/${id}.json`), 'utf8'))]))),
  JSON.parse(await readFile(path.join(root, 'knowledge/example-code-reviews/sources.json'), 'utf8')),
);
for (const example of examples) {
  const entry = catalogs[example.packageId].find((item) => item.id === example.id);
  const groups = groupExampleSources({ example: entry, sources: [...resources.keys()], dependencies: graph, policy: example.packageId === 'datagrid' ? getGridSourcePolicy(entry.id) : chartSourcePolicy });
  const reachable = new Set(groups.core);
  for (const file of reachable) for (const dependency of graph[file] ?? []) {
    if (dependency.startsWith(`/src/playgrounds/${example.packageId}/`)) reachable.add(dependency);
  }
  if (example.packageId === 'datagrid' && entry.kind === 'grid') for (const file of ['runtime/useGridController.ts', 'runtime/GridPreview.tsx', 'runtime/GridToolbar.tsx']) reachable.add(`/src/playgrounds/datagrid/${file}`);
  const files = [...reachable].flatMap((file) => {
    const source = resources.get(file);
    return source ? [{ file, content: source.content, sha256: source.sha256, priority: file === groups.core[0] ? 100 : groups.core.includes(file) ? 60 : 0 }] : [];
  });
  const discovered = discoverExamplePropReferences({ packageId: example.packageId, files, records: byId });
  const knownIds = new Set(example.references.map((reference) => reference.id));
  const knownLabels = new Set(example.references.map((reference) => reference.label));
  for (const reference of discovered.references) {
    if (knownIds.has(reference.id)) {
      const existing = example.references.find((entry) => entry.id === reference.id);
      existing.location = reference.location;
      continue;
    }
    const label = knownLabels.has(reference.label) ? `${byId.get(reference.id).owner}.${reference.label}` : reference.label;
    example.references.push({ ...reference, label });
    knownIds.add(reference.id);
    knownLabels.add(label);
  }
  example.propDiagnostics = discovered.diagnostics;
  Object.assign(example, codeReviews.resolve({ example, files, records: byId, evidenceFiles: [...resources].map(([file, source]) => ({ file, content: source.content, sha256: source.sha256 })) }));
  const uniqueReferences = new Map();
  for (const reference of example.references) {
    const current = uniqueReferences.get(reference.id);
    if (!current || (current.codeReview.method !== 'reviewed' && reference.codeReview.method === 'reviewed')) uniqueReferences.set(reference.id, reference);
  }
  example.references = [...uniqueReferences.values()].sort((a, b) => compareApiMembers(byId.get(a.id), byId.get(b.id)));
  example.references = example.references.map((reference) => ({ ...reference, codeUrl: `/${exampleCodeHref(example.packageId, example.id, reference.location)}` }));
}
codeReviews.assertComplete();
for (const guide of guides) {
  for (const id of guide.api) if (!byId.has(`@owp/${guide.packageId}:${id}`)) throw new ReferenceError(`가이드 API 누락: ${guide.id}/${id}`);
  for (const id of guide.examples) if (!catalogs[guide.packageId].some((entry) => entry.id === id)) throw new ReferenceError(`가이드 예제 누락: ${guide.id}/${id}`);
}
for (const source of sourceAudit.sources) for (const section of source.sections) {
  for (const id of section.guideIds) if (!guides.some((guide) => guide.id === id)) throw new ReferenceError(`원본 대응표의 가이드 누락: ${source.id}/${id}`);
}
const usedNative = new Set(examples.flatMap((entry) => entry.references.map((reference) => reference.id)).filter((id) => id.startsWith('chart.js:')));
const queue = allRecords.filter((record) => !record.id.startsWith('chart.js:') || usedNative.has(record.id));
for (const record of queue) {
  for (const id of apiRecordReferenceIds(record)) {
    if (!id.startsWith('chart.js:') || usedNative.has(id)) continue;
    const related = byId.get(id);
    if (related) { usedNative.add(id); queue.push(related); }
  }
}
const packages = ['datagrid', 'charts'].map((id, index) => ({
  id, name: `@owp/${id}`, version: own[index].version, declarationHash: own[index].declarationHash,
}));
const records = allRecords.filter((record) => !record.id.startsWith('chart.js:') || usedNative.has(record.id)).map((record) => {
  const documentation = parseDocumentation(record.description);
  const relatedGuides = guides.filter((guide) => guide.api.some((id) => {
    const qualified = `@owp/${guide.packageId}:${id}`;
    return record.id === qualified || record.id.startsWith(`${qualified}.`);
  }));
  return {
    ...record, requirement: record.requirement ?? 'declaration', body: '',
    ...documentation,
    description: toReferenceStyle(documentation.description),
    docTags: documentation.docTags.map((tag) => ['default', 'defaultValue'].includes(tag.name) ? tag : { ...tag, text: toReferenceStyle(tag.text) }),
    usageNote: record.package === 'chart.js' ? 'Chart.js 원본 타입. OWP 설정·callback·배열 지원은 관련 타입·예제 참고.' : null,
    locale: /[가-힣]/.test(record.description) ? 'ko' : 'en',
    related: record.related.filter((id) => !id.startsWith('chart.js:') || usedNative.has(id)),
    guideIds: relatedGuides.map((guide) => guide.id),
    examples: examples.filter((example) => example.references.some((reference) => reference.id === record.id)).map(({ packageId, id }) => ({ packageId, id })),
    sources: sourceAudit.sources.filter((source) => source.sections.some((section) => section.guideIds.some((id) => relatedGuides.some((guide) => guide.id === id)))).map((source) => source.id),
  };
});
for (const guide of guides) {
  const related = guide.api.map((id) => `@owp/${guide.packageId}:${id}`);
  records.push({
    id: guide.id, package: `@owp/${guide.packageId}`, packageVersion: packages.find((item) => item.id === guide.packageId).version,
    owner: 'Guides', name: guide.title, path: guide.id.split(':')[1], kind: 'guide', imports: [],
    description: guide.description, body: guide.body, sections: guideSections(guide), signature: '', optional: false, requirement: 'declaration',
    related, guideIds: [], locale: 'ko', defaultDescription: null, usageNote: null,
    examples: guide.examples.map((id) => ({ packageId: guide.packageId, id })),
    source: { path: 'knowledge/guides.mjs', line: 1, sha256: hash(await readFile(path.join(root, 'knowledge/guides.mjs'))) },
    sources: sourceAudit.sources.filter((source) => source.sections.some((section) => section.guideIds.includes(guide.id))).map((source) => source.id),
  });
}
const ids = new Set(records.map((record) => record.id));
if (ids.size !== records.length) throw new Error('중복 API ID가 있습니다.');
for (const record of records) for (const id of [...record.related, ...record.guideIds]) if (!ids.has(id)) throw new ReferenceError(`관련 API 누락: ${record.id}/${id}`);
for (const record of records) for (const id of apiRecordReferenceIds(record)) if (!ids.has(id)) throw new ReferenceError(`API 참조 누락: ${record.id}/${id}`);
for (const record of records) {
  const packageId = record.package === '@owp/datagrid' ? 'datagrid' : 'charts';
  record.url = `/?${new URLSearchParams({ package: packageId, view: 'api', symbol: record.id })}`;
  record.examples = record.examples.map((reference) => {
    const example = examples.find((entry) => entry.packageId === reference.packageId && entry.id === reference.id);
    const usage = example.references.find((entry) => entry.id === record.id);
    const location = usage?.location ?? null;
    return { ...reference, url: example.url, codeUrl: usage?.codeUrl ?? `/${exampleCodeHref(reference.packageId, reference.id, location)}`, location, codeReview: usage?.codeReview ?? null, entrypoint: example.entrypoint, sha256: example.sha256 };
  });
  record.contentHash = hash(JSON.stringify(record));
}
const baselineLinks = JSON.parse(await readFile(path.join(root, 'knowledge/example-code-reviews/baseline.json'), 'utf8'));
for (const reference of baselineLinks.filter((entry) => !entry.located)) {
  const example = examples.find((entry) => entry.packageId === reference.packageId && entry.id === reference.exampleId);
  if (!example?.referenceReviews.some((entry) => entry.id === reference.id && entry.label === reference.label)) throw new ReferenceError(`검토가 누락된 예제 코드 위치: ${reference.packageId}/${reference.exampleId}/${reference.label}`);
}
const currentLinks = examples.flatMap((example) => example.references);
const decisions = examples.flatMap((example) => example.referenceReviews);
const exampleLinkAudit = {
  baseline: { references: baselineLinks.length, located: baselineLinks.filter((entry) => entry.located).length, unlocated: baselineLinks.filter((entry) => !entry.located).length },
  current: { references: currentLinks.length, located: currentLinks.filter((entry) => entry.location).length, unlocated: currentLinks.filter((entry) => !entry.location).length },
  reviewed: Object.fromEntries(['locate', 'replace', 'remove', 'unlocated'].map((action) => [action, decisions.filter((entry) => entry.action === action).length])),
};
const data = { schemaVersion: 1, packages, reviewed, dependencies: Object.fromEntries(externalPackages.map((name, index) => [name, dependencies[index].version])), records, examples, exampleLinkAudit, sourceAudit };
knowledgeSchema.parse(data);
for (const entry of packages) packageKnowledgeSchema.parse(createPackageKnowledge(data, entry));
const links = Object.fromEntries(examples.map((example) => [`${example.packageId}/${example.id}`, example.references.map(({ label, id, packageId }) => ({ label, id, packageId }))]));
const outputs = { 'knowledge.generated.json': data, 'links.generated.json': links };
const destination = path.join(root, 'src/features/api/data');
await mkdir(destination, { recursive: true });
for (const [file, value] of Object.entries(outputs)) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  const target = path.join(destination, file);
  if (process.argv.includes('--check')) {
    if (await readFile(target, 'utf8') !== content) throw new Error(`문서 데이터가 현재 패키지·예제와 다릅니다: ${file}`);
  } else await writeFile(target, content);
}
console.log(`PASS API knowledge: ${records.length} records, ${guides.length} guides, ${examples.reduce((sum, example) => sum + example.references.length, 0)} example links`);

import type { Plugin } from 'vite';
import knowledge from '../src/features/api/data/knowledge.generated.json';
import type { ApiRecord } from '../src/features/api/model/knowledge';

type ResourceRecord = Omit<ApiRecord, 'kind' | 'requirement'> & { readonly kind: string; readonly requirement: string };
type KnowledgeResourceData = Omit<typeof knowledge, 'records'> & { readonly records: readonly ResourceRecord[] };

export function reviewedApiCatalog<T extends { readonly id: string; readonly api: readonly string[] }>(catalog: readonly T[], packageId: string): readonly (Omit<T, 'api'> & { readonly api: readonly string[] })[] {
  return catalog.map((entry) => {
    const example = knowledge.examples.find((example) => example.packageId === packageId && example.id === entry.id);
    return example ? { ...entry, api: example.references.map((reference) => reference.label) } : entry;
  });
}

export function knowledgeAssets(data: KnowledgeResourceData = knowledge): ReadonlyMap<string, string> {
  const assets = new Map<string, string>();
  for (const entry of data.packages) {
    const records = data.records.filter((record) => record.package === entry.name || (entry.id === 'charts' && Object.hasOwn(data.dependencies, record.package)));
    assets.set(`api/${entry.id}.json`, JSON.stringify({ schemaVersion: 1, ...entry, dependencies: data.dependencies, records }, null, 2));
  }
  assets.set('knowledge/index.json', JSON.stringify({
    schemaVersion: 1, packages: data.packages, reviewed: data.reviewed,
    resources: ['/api/datagrid.json', '/api/charts.json', '/catalogs/datagrid.sources.json', '/catalogs/charts.sources.json', '/knowledge/records.jsonl', '/knowledge/example-links.json'],
    records: data.records.map(({ id, url, packageVersion, locale, contentHash }) => ({ id, url, packageVersion, locale, contentHash })),
    sourceAudit: data.sourceAudit,
  }, null, 2));
  assets.set('knowledge/records.jsonl', `${data.records.map((record) => JSON.stringify(record)).join('\n')}\n`);
  assets.set('knowledge/example-links.json', JSON.stringify({ schemaVersion: 1, packages: data.packages, reviewed: data.reviewed, summary: data.exampleLinkAudit, examples: data.examples }, null, 2));
  for (const guide of data.records.filter((record) => record.kind === 'guide')) {
    const packageId = guide.package.replace('@owp/', '');
    const id = guide.path.replace('guide.', '');
    const originals = guide.sources.map((sourceId: string) => {
      const source = data.sourceAudit.sources.find((entry) => entry.id === sourceId);
      const lines = [`- Source ID: ${sourceId}`, `  - Path: ${sourceId}`];
      if (source) {
        lines.push(`  - SHA-256: ${source.sha256}`);
        for (const section of source.sections.filter((entry) => entry.guideIds.includes(guide.id)))
          lines.push(`  - Section: ${section.heading} (line ${section.line}; disposition: ${section.disposition})`);
      }
      return lines.join('\n');
    }).join('\n');
    assets.set(`knowledge/guides/${packageId}/${id}.md`, `# ${guide.name}\n\nPackage: ${guide.package} ${guide.packageVersion}\n\nLanguage: ${guide.locale}\n\nCanonical URL: ${guide.url}\n\nRecord ID: ${guide.id}\n\nContent hash: ${guide.contentHash}\n\nSource: ${guide.source.path} (line ${guide.source.line})\n\nSource SHA-256: ${guide.source.sha256}\n\n${guide.description}\n\n${guide.body}\n\n## Related API\n\n${guide.related.map((related: string) => {
      const record = data.records.find((entry) => entry.id === related);
      return record ? `- [${record.id}](${record.url})` : '';
    }).join('\n')}\n\n## Examples\n\n${guide.examples.map((example: ApiRecord['examples'][number]) => `- [${example.id}](${example.url}) · [Code](${example.codeUrl}) · [Source](${example.entrypoint})`).join('\n')}\n\n## Original sources\n\n${originals}\n`);
  }
  assets.set('llms.txt', '# OWP Playground\n\nVersioned API contracts, usage guides and executing examples for @owp/datagrid and @owp/charts.\n\n- [Knowledge index](/knowledge/index.json): package versions, record IDs, content hashes and source review coverage.\n- [DataGrid API](/api/datagrid.json)\n- [Charts API](/api/charts.json)\n- [Records for retrieval](/knowledge/records.jsonl): one API symbol or guide per line; retain packageVersion, locale and canonical URL.\n- [Reviewed example links](/knowledge/example-links.json): API usage locations, forwarding evidence, corrections and exclusions.\n- [DataGrid executing sources](/catalogs/datagrid.sources.json)\n- [Charts executing sources](/catalogs/charts.sources.json)\n');
  return assets;
}

export function knowledgeResourcesPlugin(): Plugin {
  return {
    name: 'playground-knowledge',
    generateBundle() {
      for (const [fileName, source] of knowledgeAssets()) this.emitFile({ type: 'asset', fileName, source });
    },
    configureServer(server) {
      const assets = knowledgeAssets();
      server.middlewares.use((request, response, next) => {
        const key = new URL(request.url ?? '/', 'http://localhost').pathname.slice(1);
        const content = assets.get(key);
        if (content === undefined) return next();
        response.setHeader('Content-Type', key.endsWith('.json') ? 'application/json; charset=utf-8' : key.endsWith('.jsonl') ? 'application/x-ndjson; charset=utf-8' : 'text/plain; charset=utf-8');
        response.end(content);
      });
    },
  };
}

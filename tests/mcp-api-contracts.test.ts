import { readFile, rm } from 'node:fs/promises';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createKnowledgeStore } from '../mcp/knowledge.ts';
import { startKnowledgeHttpServer } from '../mcp/http.ts';
import { apiOutput } from '../mcp/schema.ts';
import { createMcpFixture } from '../mcp/test-fixture.ts';
import { knowledgeSchema, type ApiRecord } from '../src/features/api/model/schema.ts';

describe('real API contracts through the MCP SDK', () => {
  let root: string;
  let close: () => Promise<void>;
  let records: readonly ApiRecord[];
  const client = new Client({ name: 'owp-contract-test', version: '1.0.0' });
  beforeAll(async () => {
    const knowledge = knowledgeSchema.parse(
      JSON.parse(await readFile('src/features/api/data/knowledge.generated.json', 'utf8')),
    );
    records = knowledge.records;
    root = await createMcpFixture(knowledge);
    const server = await startKnowledgeHttpServer({ archiveRoot: root, port: 0 });
    close = () => server.close();
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${server.port}/mcp`)),
    );
  }, 30000);
  afterAll(async () => {
    await client.close();
    await close?.();
    if (root) await rm(root, { recursive: true, force: true });
  });

  for (const [packageId, symbol] of [
    ['datagrid', '@owp/datagrid:OwpDataGridApi.acceptChanges'],
    ['charts', '@owp/charts:GaugeMotionOptions.animateOnMount'],
    ['charts', '@owp/charts:BoxPlotDatasetOptions'],
    ['charts', 'chart.js:ChartType'],
    ['charts', 'chart.js:Plugin'],
  ] as const) {
    it(`preserves the complete declaration contract when the SDK requests ${symbol}`, async () => {
      // Given
      const original = records.find((record) => record.id === symbol);
      if (!original) throw new TypeError(`API fixture가 없습니다: ${symbol}`);
      const store = createKnowledgeStore({ archiveRoot: root });
      const projected = {
        ...original,
        url: store.sourceUrl('release-new', original.url),
        examples: original.examples.map((example) => ({
          ...example,
          url: store.sourceUrl('release-new', example.url),
          codeUrl: store.sourceUrl('release-new', example.codeUrl),
          entrypoint: store.sourceUrl('release-new', example.entrypoint),
        })),
      };
      // When
      const result = await client.callTool({
        name: 'get_api',
        arguments: { package: packageId, symbol, releaseId: 'release-new' },
      });
      // Then
      const response = apiOutput.parse(result.structuredContent);
      expect(response.record).toEqual(projected);
      expect(result.content).toEqual([
        { type: 'text', text: JSON.stringify(result.structuredContent) },
      ]);
      if (original.package === 'chart.js') {
        expect(response.package).toBe('@owp/charts');
        expect(response.record.package).toBe('chart.js');
        expect(response.record.packageVersion).not.toBe(response.packageVersion);
      }
    }, 15000);
  }
});

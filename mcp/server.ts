import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import { z } from 'zod';
import mcpManifest from './package.json' with { type: 'json' };
import { VersionArchiveError } from '../scripts/version-archive.ts';
import {
  createKnowledgeStore,
  KnowledgeError,
  resourceRequestSchema,
  type KnowledgeOptions,
  type KnowledgeStore,
} from './knowledge.ts';
import {
  apiInput,
  apiOutput,
  exampleInput,
  exampleOutput,
  guideInput,
  guideOutput,
  listInput,
  listOutput,
  searchInput,
  searchOutput,
} from './schema.ts';

async function result<T extends Record<string, unknown>>(operation: () => Promise<T>) {
  try {
    const structuredContent = await operation();
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(structuredContent) }],
      structuredContent,
    };
  } catch (error) {
    if (
      !(
        error instanceof KnowledgeError ||
        error instanceof VersionArchiveError ||
        error instanceof z.ZodError
      )
    )
      throw error;
    const structuredContent = {
      schemaVersion: 1,
      error: {
        code: error instanceof z.ZodError ? 'INVALID_INPUT' : error.code,
        message:
          error instanceof z.ZodError
            ? '데이터 형식이 올바르지 않습니다.'
            : error instanceof VersionArchiveError
              ? 'archive 데이터를 읽거나 검증할 수 없습니다.'
              : error.message,
        availableVersions: error instanceof KnowledgeError ? error.availableVersions : [],
      },
    };
    return {
      isError: true,
      content: [{ type: 'text' as const, text: JSON.stringify(structuredContent) }],
      structuredContent,
    };
  }
}

export function createKnowledgeServer(
  options: KnowledgeOptions,
  store: KnowledgeStore = createKnowledgeStore(options),
) {
  const server = new McpServer(
    { name: mcpManifest.name, version: mcpManifest.version },
    {
      instructions:
        '읽기 전용 OWP Knowledge입니다. 응답의 releaseId와 packageVersion을 다음 호출에 지정하면 같은 snapshot을 조회합니다. 예제와 API의 sourceUrls는 검증된 archive를 가리킵니다.',
    },
  );
  const annotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  } as const;
  server.registerTool(
    'list_packages',
    {
      description:
        '완료된 Playground package와 현재 release의 정확한 버전, 조회 가능한 버전 목록을 반환합니다.',
      inputSchema: listInput,
      outputSchema: listOutput,
      annotations,
    },
    (input) => result(() => store.listPackages(input)),
  );
  server.registerTool(
    'search_knowledge',
    {
      description:
        'package의 API·가이드·실행 예제 요약을 검색합니다. offset과 limit으로 페이지를 조회합니다.',
      inputSchema: searchInput,
      outputSchema: searchOutput,
      annotations,
    },
    (input) => result(() => store.searchKnowledge(input)),
  );
  server.registerTool(
    'get_api',
    {
      description:
        '정확한 API ID 또는 고유한 이름으로 계약을 조회합니다. members는 한 페이지로 제한됩니다.',
      inputSchema: apiInput,
      outputSchema: apiOutput,
      annotations,
    },
    (input) => result(() => store.getApi(input)),
  );
  server.registerTool(
    'get_example',
    {
      description:
        '실제 실행 예제 TSX와 dependency manifest를 조회합니다. file·offset·startLine으로 이어 읽고 includeDependencies로 의존 파일을 포함합니다.',
      inputSchema: exampleInput,
      outputSchema: exampleOutput,
      annotations,
    },
    (input) => result(() => store.getExample(input)),
  );
  server.registerTool(
    'get_guide',
    {
      description:
        '가이드를 조회합니다. setup은 package 기본 연결 가이드이며 offset·maxChars로 이어 읽습니다.',
      inputSchema: guideInput,
      outputSchema: guideOutput,
      annotations,
    },
    (input) => result(() => store.getGuide(input)),
  );
  server.registerResource(
    'owp-knowledge',
    new ResourceTemplate('owp://{releaseId}/{package}/{kind}/{key}', {
      list: async () => ({ resources: await store.resourceLinks() }),
    }),
    {
      description: 'release에 고정된 package API, 가이드, 실행 예제 source',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const parsed = resourceRequestSchema.parse(variables);
      const input = { ...parsed, key: decodeURIComponent(parsed.key) };
      const pin = { package: input.package, releaseId: input.releaseId };
      let data;
      switch (input.kind) {
        case 'api':
          data = await store.getApi({ ...pin, symbol: input.key });
          break;
        case 'guide':
          data = await store.getGuide({ ...pin, guideId: input.key });
          break;
        case 'source':
          data = await store.getExample({ ...pin, exampleId: input.key });
          break;
        default:
          return input.kind satisfies never;
      }
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data) }],
      };
    },
  );
  return server;
}

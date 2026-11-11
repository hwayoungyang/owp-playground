import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { DistributionError } from '../../scripts/distribution/integrity.ts';
import { CompanyKnowledgeError, createCompanyKnowledgeStore } from './store.ts';
import type { BundlePin } from './model.ts';
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

async function result(operation: () => Promise<Record<string, unknown>>) {
  try {
    const structuredContent = await operation();
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(structuredContent) }],
      structuredContent,
    };
  } catch (error) {
    if (
      !(
        error instanceof CompanyKnowledgeError ||
        error instanceof DistributionError ||
        error instanceof z.ZodError
      )
    )
      throw error;
    const structuredContent = {
      schemaVersion: 1,
      error: {
        code: error instanceof z.ZodError ? 'INVALID_INPUT' : error.code,
        message: error instanceof z.ZodError ? '데이터 형식이 올바르지 않습니다.' : error.message,
        availableVersions: [],
      },
    };
    return {
      isError: true,
      content: [{ type: 'text' as const, text: JSON.stringify(structuredContent) }],
      structuredContent,
    };
  }
}

export function createCompanyKnowledgeServer(options: {
  readonly bundleRoot: string;
  readonly pin: BundlePin;
}) {
  const store = createCompanyKnowledgeStore(options);
  const server = new McpServer(
    { name: '@owp/company-mcp', version: '0.1.0' },
    {
      instructions:
        '시작 시 고정된 고객 번들의 읽기 전용 Knowledge입니다. 응답의 releaseId와 packageVersion을 후속 조회에 사용하세요. 포함되지 않은 package·버전·자료·release로 범위를 넓힐 수 없습니다. 상대 sourceUrls는 이 번들에 실제 포함된 파일입니다.',
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
        '포함된 API·type·가이드·예제 또는 명시적으로 요청한 source가 있는 package와 정확한 버전을 조회합니다.',
      inputSchema: listInput,
      outputSchema: listOutput,
      annotations,
    },
    (input) => result(() => store.listPackages(input)),
  );
  server.registerTool(
    'search_knowledge',
    {
      description: '포함된 API·가이드·예제를 페이지별로 검색합니다.',
      inputSchema: searchInput,
      outputSchema: searchOutput,
      annotations,
    },
    (input) => result(() => store.searchKnowledge(input)),
  );
  server.registerTool(
    'get_api',
    {
      description: '실제 projected 선언의 API·type과 포함된 member를 조회합니다.',
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
        '포함된 예제 또는 source 항목 ID로 source와 hash·의존성을 조회합니다. 응답의 id·package·packageVersion·releaseId를 exampleId·package·version·releaseId로 고정하고 continuation 전체와 같은 includeDependencies를 사용해 이어 읽습니다. continuation의 pendingStart는 아직 읽지 않은 지정 파일의 위치이므로 그대로 전달합니다. dependency 조회의 offset은 요청 file과 무관한 entrypoint·item.files 순서이며 maxChars는 응답 전체의 content 예산입니다. 줄 번호와 UTF-16 column은 1부터 시작합니다.',
      inputSchema: exampleInput,
      outputSchema: exampleOutput,
      annotations,
    },
    (input) => result(() => store.getExample(input)),
  );
  server.registerTool(
    'get_guide',
    {
      description: '포함된 가이드를 offset·maxChars로 이어 읽습니다.',
      inputSchema: guideInput,
      outputSchema: guideOutput,
      annotations,
    },
    (input) => result(() => store.getGuide(input)),
  );
  server.registerResource(
    'owp-company-knowledge',
    new ResourceTemplate('owp://{releaseId}/{package}/{kind}/{key}', {
      list: async () => store.listResources({}),
    }),
    { description: '고정된 회사 release의 API·가이드·예제 source', mimeType: 'application/json' },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(await store.readResource(uri.href)),
        },
      ],
    }),
  );
  // SDK의 URL 정규화 전에 원문 URI를 검사해 encoded traversal도 거부합니다.
  server.server.setRequestHandler('resources/read', async (request) => ({
    contents: [
      {
        uri: request.params.uri,
        mimeType: 'application/json',
        text: JSON.stringify(await store.readResource(request.params.uri)),
      },
    ],
  }));
  server.server.setRequestHandler('resources/list', async (request) =>
    store.listResources(
      request.params?.cursor === undefined ? {} : { cursor: request.params.cursor },
    ),
  );
  return server;
}

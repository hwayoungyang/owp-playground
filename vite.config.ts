import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
import { sourceGraphPlugin } from './scripts/source-graph.ts';
import { knowledgeResourcesPlugin, reviewedApiCatalog } from './scripts/knowledge-resources.ts';
import {
  createDataGridSourceManifest,
  createPackageSourceManifest,
  readSourceResources,
  SourceDependencyError,
} from './scripts/source-resources.ts';
import { legacySourcePaths } from './src/features/code/source-paths.ts';
import { chartCatalog } from './src/playgrounds/charts/catalog.ts';
import { chartEnglish } from './src/playgrounds/charts/locales/en.ts';
import { gridCatalog } from './src/playgrounds/datagrid/catalog.ts';
import { coreCatalog } from './src/playgrounds/core/catalog.ts';
import { coreEnglish } from './src/playgrounds/core/locales/en.ts';
import { catalogEnglish } from './src/playgrounds/datagrid/locales/catalog.en.ts';
import { packageCatalog } from './src/playgrounds/registry.ts';

const gridDocumentationCatalog = reviewedApiCatalog(gridCatalog, 'datagrid');
const chartDocumentationCatalog = reviewedApiCatalog(chartCatalog, 'charts');
const coreDocumentationCatalog = reviewedApiCatalog(coreCatalog, 'core');
const publicBase = process.env.OWP_PUBLIC_BASE ?? '/';
if (!/^\/(?:[A-Za-z0-9_.-]+\/)*$/.test(publicBase))
  throw new TypeError('OWP_PUBLIC_BASE는 /로 시작하고 끝나는 안전한 공개 경로여야 합니다.');

export default defineConfig({
  base: publicBase,
  resolve: {
    // DataGrid의 중첩 설치본과 앱이 같은 Theme Context를 사용하도록 연결합니다.
    dedupe: ['@owp/theme'],
  },
  define: {
    __OWP_RELEASE__: JSON.stringify({
      releaseId: process.env.OWP_RELEASE_ID ?? null,
      createdAt: process.env.OWP_RELEASE_CREATED_AT ?? null,
      channel: process.env.OWP_RELEASE_CHANNEL ?? 'draft',
    }),
  },
  lint: {
    ignorePatterns: [
      '/*',
      '!/src/',
      '!/mcp/',
      '!/tests/',
      '!/vite.config.ts',
      '!/vitest.config.ts',
    ],
    plugins: ['typescript', 'unicorn', 'oxc', 'react', 'jsx-a11y'],
    options: { denyWarnings: true, reportUnusedDisableDirectives: 'error' },
    rules: {
      'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
      'no-var': 'error',
      'prefer-const': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/no-non-null-assertion': 'error',
      'typescript/consistent-type-imports': 'error',
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
      // 기존 role과 MUI 컴포넌트의 DOM 구조를 보존합니다.
      'jsx-a11y/prefer-tag-over-role': 'off',
      // React Compiler 최적화 규칙 도입은 별도 작업으로 분리합니다.
      'react/refs': 'off',
      'react/set-state-in-effect': 'off',
      'react/immutability': 'off',
      'react/preserve-manual-memoization': 'off',
      'react/rules-of-hooks': 'error',
      'react/exhaustive-deps': 'error',
    },
  },
  fmt: {
    ignorePatterns: [
      'dist/**',
      'scripts/**',
      'public/**',
      '**/*.md',
      'src/features/api/data/*.generated.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
    ],
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    singleQuote: true,
    semi: true,
    trailingComma: 'all',
    sortImports: false,
    sortPackageJson: false,
    overrides: [{ files: ['**/*.css'], options: { singleQuote: false } }],
  },
  plugins: [
    react(),
    sourceGraphPlugin(),
    knowledgeResourcesPlugin(),
    {
      name: 'reuse-dev-browser-tab',
      configureServer() {
        if (
          process.platform === 'darwin' &&
          process.env.BROWSER === undefined &&
          !process.env.BROWSER_ARGS
        ) {
          process.env.BROWSER = fileURLToPath(
            new URL('./scripts/open-browser.js', import.meta.url),
          );
        }
      },
    },
    {
      name: 'playground-resources',
      async generateBundle() {
        const root = fileURLToPath(new URL('.', import.meta.url));
        const sources = await readSourceResources(root);
        this.emitFile({
          type: 'asset',
          fileName: 'catalogs/core.sources.json',
          source: JSON.stringify(
            await createPackageSourceManifest({
              root,
              catalog: coreDocumentationCatalog,
              resources: sources,
              packageName: '@owp/core',
              basePath: publicBase,
              supportFiles: [
                '/src/playgrounds/core/runtime/CoreProviders.tsx',
                '/src/playgrounds/core/runtime/CoreEnvironmentScope.tsx',
                '/src/playgrounds/core/styles.css',
              ],
            }),
            null,
            2,
          ),
        });
        for (const language of ['ko', 'en'])
          this.emitFile({
            type: 'asset',
            fileName: `catalogs/core${language === 'en' ? '.en' : ''}.json`,
            source: JSON.stringify(
              {
                version: 1,
                package: '@owp/core',
                language,
                samples: coreDocumentationCatalog.map((example) => ({
                  ...example,
                  title:
                    language === 'en'
                      ? (coreEnglish[example.title] ?? example.title)
                      : example.title,
                  description:
                    language === 'en'
                      ? (coreEnglish[example.description] ?? example.description)
                      : example.description,
                })),
              },
              null,
              2,
            ),
          });
        this.emitFile({
          type: 'asset',
          fileName: 'catalogs/datagrid.sources.json',
          source: JSON.stringify(
            await createDataGridSourceManifest({
              root,
              catalog: gridDocumentationCatalog,
              resources: sources,
              basePath: publicBase,
            }),
            null,
            2,
          ),
        });
        this.emitFile({
          type: 'asset',
          fileName: 'packages.json',
          source: JSON.stringify({ version: 1, packages: packageCatalog }, null, 2),
        });
        this.emitFile({
          type: 'asset',
          fileName: 'catalogs/charts.sources.json',
          source: JSON.stringify(
            await createPackageSourceManifest({
              root,
              catalog: chartDocumentationCatalog,
              resources: sources,
              packageName: '@owp/charts',
              basePath: publicBase,
            }),
            null,
            2,
          ),
        });
        this.emitFile({
          type: 'asset',
          fileName: 'catalog.json',
          source: JSON.stringify(
            { version: 1, package: '@owp/datagrid', samples: gridDocumentationCatalog },
            null,
            2,
          ),
        });
        this.emitFile({
          type: 'asset',
          fileName: 'catalog.en.json',
          source: JSON.stringify(
            {
              version: 1,
              language: 'en',
              package: '@owp/datagrid',
              samples: gridDocumentationCatalog.map((example) => ({
                ...example,
                title: catalogEnglish[example.title] ?? example.title,
                description: catalogEnglish[example.description] ?? example.description,
              })),
            },
            null,
            2,
          ),
        });
        for (const language of ['ko', 'en']) {
          this.emitFile({
            type: 'asset',
            fileName: `catalogs/charts${language === 'en' ? '.en' : ''}.json`,
            source: JSON.stringify(
              {
                version: 1,
                package: '@owp/charts',
                language,
                samples: chartDocumentationCatalog.map((example) => ({
                  ...example,
                  title:
                    language === 'en'
                      ? (chartEnglish[example.title] ??
                        catalogEnglish[example.title] ??
                        example.title)
                      : example.title,
                  description:
                    language === 'en'
                      ? (chartEnglish[example.description] ?? example.description)
                      : example.description,
                })),
              },
              null,
              2,
            ),
          });
        }
        for (const [file, resource] of sources) {
          this.emitFile({
            type: 'asset',
            fileName: file.replace(/^\/src\//, 'snippets/'),
            source: resource.content,
          });
        }
        for (const [legacy, file] of Object.entries(legacySourcePaths)) {
          const resource = sources.get(`/src/${file}`);
          if (!resource) throw new SourceDependencyError(legacy, file);
          this.emitFile({
            type: 'asset',
            fileName: `snippets/${legacy}`,
            source: resource.content,
          });
        }
      },
    },
  ],
  build: { target: 'es2022', outDir: process.env.OWP_BUILD_OUT_DIR ?? 'dist' },
});

import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
import { sourceGraphPlugin } from './scripts/source-graph.ts';
import {
  createDataGridSourceManifest,
  readSourceResources,
  SourceDependencyError,
} from './scripts/source-resources.ts';
import { legacySourcePaths } from './src/features/code/source-paths.ts';
import { chartCatalog } from './src/playgrounds/charts/catalog.ts';
import { chartEnglish } from './src/playgrounds/charts/locales/en.ts';
import { gridCatalog } from './src/playgrounds/datagrid/catalog.ts';
import { catalogEnglish } from './src/playgrounds/datagrid/locales/catalog.en.ts';
import { packageCatalog } from './src/playgrounds/registry.ts';

export default defineConfig({
  lint: {
    ignorePatterns: ['/*', '!/src/', '!/tests/', '!/vite.config.ts', '!/vitest.config.ts'],
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
          fileName: 'catalogs/datagrid.sources.json',
          source: JSON.stringify(
            await createDataGridSourceManifest({ root, catalog: gridCatalog, resources: sources }),
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
          fileName: 'catalog.json',
          source: JSON.stringify(
            { version: 1, package: '@owp/datagrid', samples: gridCatalog },
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
              samples: gridCatalog.map((example) => ({
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
                samples: chartCatalog.map((example) => ({
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
  build: { target: 'es2022' },
});

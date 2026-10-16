import { readdir, readFile } from 'node:fs/promises';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { legacySourcePaths } from './src/features/code/source-paths.ts';
import { chartCatalog } from './src/playgrounds/charts/catalog.ts';
import { chartEnglish } from './src/playgrounds/charts/locales/en.ts';
import { sampleCatalog } from './src/playgrounds/datagrid/catalog.ts';
import { catalogEnglish } from './src/playgrounds/datagrid/locales/catalog.en.ts';
import { packageCatalog } from './src/playgrounds/registry.ts';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sample-resources',
      async generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'packages.json',
          source: JSON.stringify({ version: 1, packages: packageCatalog }, null, 2),
        });
        this.emitFile({
          type: 'asset',
          fileName: 'catalog.json',
          source: JSON.stringify(
            { version: 1, package: '@owp/datagrid', samples: sampleCatalog },
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
              samples: sampleCatalog.map((sample) => ({
                ...sample,
                title: catalogEnglish[sample.title] ?? sample.title,
                description: catalogEnglish[sample.description] ?? sample.description,
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
                samples: chartCatalog.map((sample) => ({
                  ...sample,
                  title:
                    language === 'en'
                      ? (chartEnglish[sample.title] ?? catalogEnglish[sample.title] ?? sample.title)
                      : sample.title,
                  description:
                    language === 'en'
                      ? (chartEnglish[sample.description] ?? sample.description)
                      : sample.description,
                })),
              },
              null,
              2,
            ),
          });
        }
        const sources = await readdir(new URL('./src/', import.meta.url), { recursive: true });
        for (const file of sources.filter((file) => /\.(?:ts|tsx|css)$/.test(file)).sort()) {
          this.emitFile({
            type: 'asset',
            fileName: `snippets/${file}`,
            source: await readFile(new URL(`./src/${file}`, import.meta.url), 'utf8'),
          });
        }
        for (const [legacy, file] of Object.entries(legacySourcePaths)) {
          this.emitFile({
            type: 'asset',
            fileName: `snippets/${legacy}`,
            source: await readFile(new URL(`./src/${file}`, import.meta.url), 'utf8'),
          });
        }
      },
    },
  ],
  build: { target: 'es2022' },
});

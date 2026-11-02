import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { readComponentsApiProjection } from './components-api-data.ts';
import type { ComponentsApiProjection } from './components-api-data.ts';

const virtualId = 'virtual:components-api-data';
const resolvedId = `\0${virtualId}`;

export function componentsApiPlugin(): Plugin {
  let root = process.cwd();
  let projection: ComponentsApiProjection | undefined;
  return {
    name: 'components-api-data',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      return id === virtualId ? resolvedId : null;
    },
    load(id) {
      if (id !== resolvedId) return null;
      projection ??= readComponentsApiProjection(root);
      for (const file of projection.watchFiles) this.addWatchFile(file);
      for (const file of [
        'catalog.ts',
        'model/componentCatalog.ts',
        'model/hookCatalog.ts',
        'model/utilCatalog.ts',
        'model/scenarioCatalog.ts',
      ])
        this.addWatchFile(resolve(root, 'src/playgrounds/components', file));
      return `export const componentsApiData = ${JSON.stringify(projection.data)};`;
    },
    watchChange(id) {
      if (projection?.watchFiles.includes(id)) projection = undefined;
    },
  };
}

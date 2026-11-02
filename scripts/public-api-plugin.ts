import type { Plugin } from 'vite';
import { publicApiPackageIds, isPublicApiPackage } from '../src/features/public-api/types.ts';
import type { PublicApiPackageData, PublicApiPackageId } from '../src/features/public-api/types.ts';
import { readPublicApiPackage } from './public-api-data.ts';

export function publicApiPlugin(): Plugin {
  let root = process.cwd();
  // Compiler를 보관하지 않고 화면에 필요한 projection만 캐시합니다.
  const cache = new Map<PublicApiPackageId, PublicApiPackageData>();
  const data = (id: PublicApiPackageId) => {
    const existing = cache.get(id);
    if (existing) return existing;
    const projection = readPublicApiPackage(root, id);
    cache.set(id, projection);
    return projection;
  };
  return {
    name: 'public-api-reference',
    configResolved(config) { root = config.root; },
    resolveId(id) { return id.startsWith('virtual:public-api/') ? `\0${id}` : null; },
    load(id) {
      if (!id.startsWith('\0virtual:public-api/')) return null;
      const name = id.slice('\0virtual:public-api/'.length);
      if (name === 'index') {
        const index = publicApiPackageIds.map((packageId) => {
          const projection = data(packageId);
          this.addWatchFile(`${root}/node_modules/@owp/${packageId}/package.json`);
          return { id: packageId, version: projection.version, entries: projection.entries.map(({ id, name, label, packageId, kind, group, modules, description, exampleIds }) => ({ id, name, label, packageId, kind, group, modules, description, exampleIds })) };
        });
        return `export default ${JSON.stringify(index)};`;
      }
      if (!isPublicApiPackage(name)) return null;
      return `export default ${JSON.stringify(data(name))};`;
    },
    watchChange(id) {
      if (id.includes('/@owp/') || id.includes('/playgrounds/') || id.includes('/public-api-')) cache.clear();
    },
  };
}

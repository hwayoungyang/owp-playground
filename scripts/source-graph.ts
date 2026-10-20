import path from 'node:path';
import type { Plugin } from 'vite';
import { readSourceResources, sourceDependencyGraph } from './source-resources.ts';

const moduleId = 'virtual:playground-source-graph';
const resolvedId = `\0${moduleId}`;

/** 실행 소스의 상대 import 관계를 개발·빌드 단계에서 계산합니다. */
export function sourceGraphPlugin(): Plugin {
  let root = '';
  return {
    name: 'playground-source-graph',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (id === moduleId) return resolvedId;
    },
    async load(id) {
      if (id !== resolvedId) return;
      const resources = await readSourceResources(root);
      for (const file of resources.keys()) this.addWatchFile(path.join(root, file.slice(1)));
      return `export default ${JSON.stringify(sourceDependencyGraph(resources))};`;
    },
    handleHotUpdate(context) {
      const graph = context.server.moduleGraph.getModuleById(resolvedId);
      if (graph && /\.(?:ts|tsx|css)$/.test(context.file)) {
        context.server.moduleGraph.invalidateModule(graph);
        return [...context.modules, graph];
      }
    },
  };
}

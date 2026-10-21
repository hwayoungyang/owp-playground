import type { ExampleMetadata } from '../../shared/types/playground';
import { exampleSourcePath } from './source-paths.ts';

export type SourcePolicy = {
  readonly core: readonly string[];
  readonly roots?: readonly string[];
  readonly coreDirectories?: readonly string[];
};

/** 예제에서 사용하는 핵심 구현과 공통·지원 소스를 중복 없이 구분합니다. */
export function groupExampleSources({
  example,
  sources,
  dependencies,
  policy,
}: {
  readonly example: Pick<ExampleMetadata, 'package' | 'source'>;
  readonly sources: readonly string[];
  readonly dependencies: Readonly<Record<string, readonly string[]>>;
  readonly policy?: SourcePolicy;
}) {
  const initial = `/src/${exampleSourcePath(example)}`;
  const directory = `/src/playgrounds/${example.package.replace(/^@owp\//, '')}/`;
  const candidates = new Set(policy?.core.map((file) => `${directory}${file}`));
  const coreDirectories = policy?.coreDirectories?.map((prefix) => `${directory}${prefix}`) ?? [];
  const available = new Set(
    sources.filter(
      (file) =>
        !file.endsWith('.d.ts') &&
        (!file.startsWith('/src/playgrounds/') || file.startsWith(directory)),
    ),
  );
  const core = new Set([initial]);
  const visit = (file: string) => {
    for (const dependency of dependencies[file] ?? []) {
      if (
        !available.has(dependency) ||
        (!candidates.has(dependency) &&
          !coreDirectories.some((prefix) => dependency.startsWith(prefix))) ||
        core.has(dependency)
      )
        continue;
      core.add(dependency);
      visit(dependency);
    }
  };
  for (const root of policy?.roots ?? []) {
    const file = `${directory}${root}`;
    if (available.has(file)) core.add(file);
  }
  for (const file of core) visit(file);
  return {
    core: [
      initial,
      ...[...core].filter((file) => file !== initial && !candidates.has(file)),
      ...(policy?.core ?? []).map((file) => `${directory}${file}`).filter((file) => core.has(file)),
    ],
    support: [...available].filter((file) => !core.has(file)).sort(),
  };
}

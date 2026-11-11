import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, sep } from 'node:path';
import { z } from 'zod';
import { DistributionError } from '../distribution/integrity.ts';

const metadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  dependencies: z.record(z.string(), z.string()).optional(),
  optionalDependencies: z.record(z.string(), z.string()).optional(),
  peerDependencies: z.record(z.string(), z.string()).optional(),
});

export function toolingRoot(file: string): string | undefined {
  const marker = `${sep}node_modules${sep}`;
  if (!file.includes(marker)) return undefined;
  const tail = file.slice(file.lastIndexOf(marker) + marker.length).split(sep);
  const count = tail[0]?.startsWith('@') ? 2 : 1;
  return resolve(file.slice(0, file.lastIndexOf(marker) + marker.length), ...tail.slice(0, count));
}

/** folder·npm alias와 무관하게 설치 metadata의 실제 package identity를 검사합니다. */
export function installedPublicPackage(file: string) {
  const root = toolingRoot(realpathSync(file));
  if (!root)
    throw new DistributionError(
      'company-public-package',
      '설치된 공개 package 파일만 사용할 수 있습니다.',
    );
  const metadata = metadataSchema.parse(
    JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')),
  );
  if (metadata.name.startsWith('@owp/'))
    throw new DistributionError(
      'company-full-package',
      '전체 비공개 OWP package는 alias로도 포함할 수 없습니다.',
    );
  return { root, metadata };
}

/** 명시한 공개 root와 그 package가 선언한 실제 공개 dependency closure만 허용합니다. */
export function publicPackageBoundary(reviewed: readonly string[], types = false) {
  const allowed = new Set<string>();
  const pending: ReturnType<typeof installedPublicPackage>[] = [];
  const toolRequire = createRequire(import.meta.url);
  function locate(specifier: string, from: string): string | undefined {
    const requireFrom = createRequire(from);
    for (const key of [`${specifier}/package.json`, specifier]) {
      try {
        return requireFrom.resolve(key);
      } catch (error) {
        if (
          !(
            error instanceof Error &&
            'code' in error &&
            ['MODULE_NOT_FOUND', 'ERR_PACKAGE_PATH_NOT_EXPORTED'].includes(String(error.code))
          )
        )
          throw error;
      }
    }
    return undefined;
  }
  function add(file: string, expected?: string) {
    const pkg = installedPublicPackage(file);
    if (expected && pkg.metadata.name !== expected)
      throw new DistributionError(
        'company-public-alias',
        '검토한 공개 package 이름과 실제 설치 이름이 다릅니다.',
      );
    if (!allowed.has(pkg.root)) {
      allowed.add(pkg.root);
      pending.push(pkg);
    }
  }
  const seeds = [
    ...new Set([
      'react',
      'react-dom',
      ...reviewed,
      ...(types ? ['@types/react', '@types/react-dom'] : []),
    ]),
  ];
  for (const name of seeds) {
    if (name.startsWith('@owp/'))
      throw new DistributionError(
        'company-public-package',
        'OWP package는 exact company root로만 사용할 수 있습니다.',
      );
    const file = locate(name, toolRequire.resolve('./public-packages.ts'));
    if (!file)
      throw new DistributionError(
        'company-public-missing',
        '검토한 공개 package를 resolve할 수 없습니다.',
      );
    add(file, name);
  }
  if (types) add(toolRequire.resolve('typescript-compiler-api'), '@typescript/typescript6');
  for (let index = 0; index < pending.length; index++) {
    const pkg = pending[index];
    if (!pkg) continue;
    const dependencies = {
      ...pkg.metadata.dependencies,
      ...pkg.metadata.optionalDependencies,
      ...pkg.metadata.peerDependencies,
    };
    for (const name of Object.keys(dependencies)) {
      if (name.startsWith('@owp/')) continue;
      const file = locate(name, resolve(pkg.root, 'package.json'));
      if (!file || !existsSync(file)) continue;
      // 선언되지 않은 private alias는 실제 load 시 아래 assertFile에서 반드시 거부합니다.
      const root = toolingRoot(realpathSync(file));
      if (!root) continue;
      const metadata = metadataSchema.parse(
        JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')),
      );
      if (!metadata.name.startsWith('@owp/')) add(file);
    }
  }
  return {
    assertFile(file: string): void {
      const pkg = installedPublicPackage(file);
      if (!allowed.has(pkg.root))
        throw new DistributionError(
          'company-public-unreviewed',
          '명시적으로 검토한 공개 package와 실제 dependency만 사용할 수 있습니다.',
        );
    },
  };
}

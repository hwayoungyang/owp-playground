import { statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, it } from 'vitest';

it('Node 리소스 예제의 기본 호출이 설치된 Core 디렉터리를 반환한다', () => {
  // Given: 공개 CommonJS 진입점의 실제 함수
  const require = createRequire(new URL('../package.json', import.meta.url));
  const exported: unknown = require('@owp/core/vite/owpCoreAssetsPlugin.cjs');
  if (!exported || typeof exported !== 'object')
    throw new TypeError('Missing Core Node entry point');
  // When: 문서의 예제처럼 별도 경로 없이 호출한다.
  const roots = Object.entries(exported)
    .filter(([name]) => name.startsWith('resolveOwp'))
    .map(([name, value]) => {
      if (typeof value !== 'function') throw new TypeError(`Invalid resolver: ${name}`);
      const result: unknown = value();
      if (typeof result !== 'string') throw new TypeError(`Invalid resource path: ${name}`);
      return result;
    });
  // Then: 소비앱의 가상 경로가 아닌 실제 패키지 리소스가 존재한다.
  expect(roots).toHaveLength(3);
  for (const root of roots) expect(statSync(root).isDirectory()).toBe(true);
});

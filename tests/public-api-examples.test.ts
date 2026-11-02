import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import ts from 'typescript-compiler-api';
import { expect, it } from 'vitest';
import { readPublicApiPackage } from '../scripts/public-api-data';
import { publicApiPackageIds } from '../src/features/public-api/types';

it('모든 TypeScript 연결 예제를 실제 설치본으로 타입 검사한다', () => {
  // Given: 화면에 표시하는 사용 예제와 실제 공개 선언
  const root = fileURLToPath(new URL('..', import.meta.url));
  const samples = new Map<string, string>();
  const names = new Map<string, string>();
  for (const id of publicApiPackageIds) {
    for (const [index, entry] of readPublicApiPackage(root, id).entries.entries()) {
      if (entry.javascript || entry.kind === 'asset') continue;
      const file = resolve(root, 'tests', `public-api-example-${id}-${index}.tsx`);
      samples.set(file, entry.usage);
      names.set(file, entry.id);
    }
  }
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  };
  const host = ts.createCompilerHost(options);
  const read = host.readFile.bind(host);
  const exists = host.fileExists.bind(host);
  host.readFile = (file) => samples.get(file) ?? read(file);
  host.fileExists = (file) => samples.has(file) || exists(file);
  // When: 예제를 독립된 소비앱 모듈로 검사한다.
  const program = ts.createProgram([...samples.keys()], options, host);
  const errors = ts.getPreEmitDiagnostics(program).map((diagnostic) => ({
    symbol: diagnostic.file ? names.get(diagnostic.file.fileName) : undefined,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  }));
  // Then: 타입 전용 재수출·overload·generic·JSX 사용에 오류가 없다.
  expect(samples.size).toBeGreaterThan(1_000);
  expect(errors).toEqual([]);
}, 90_000);

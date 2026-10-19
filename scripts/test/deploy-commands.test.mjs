import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const root = fileURLToPath(new URL('../../', import.meta.url));

for (const [args, usage] of [
  [['deploy', '--', '--help'], '사용법: pnpm deploy [-- 옵션]'],
  [['deploy:preflight', '--help'], '사전 검사만 실행: pnpm deploy:preflight'],
  [['deploy:status', '--help'], '사용법: pnpm deploy:status'],
  [['deploy:rollback', '--help'], '사용법: pnpm deploy:rollback'],
  [['deploy:cleanup', '--help'], '사용법: pnpm deploy:cleanup'],
]) {
  test(`pnpm ${args.join(' ')} reaches the project CLI without modifying dependencies`, async () => {
    const lockfile = await readFile(path.join(root, 'pnpm-lock.yaml'));
    const { stdout, stderr } = await execute('pnpm', args, { cwd: root, timeout: 15_000 });
    assert.ok(stdout.includes(usage));
    assert.doesNotMatch(stdout + stderr, /Unknown option|Unexpected argument|SSH 포트 접근: OK|pnpm build 실행 중/);
    assert.deepEqual(await readFile(path.join(root, 'pnpm-lock.yaml')), lockfile);
  });
}

for (const args of [['deploy'], ['deploy:preflight'], ['deploy', '--', '--preflight-only']]) {
  test(`pnpm ${args.join(' ')} preserves the VPN guard before network access`, async () => {
    await assert.rejects(execute('pnpm', args, { cwd: root, timeout: 15_000 }), (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /비대화형 실행에는 명시적인 VPN 확인이 필요합니다/);
      assert.doesNotMatch(error.stderr, /Unknown option|Unexpected argument/);
      assert.doesNotMatch(error.stdout, /SSH 포트 접근: OK|pnpm build 실행 중/);
      return true;
    });
  });
}

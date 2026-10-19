import { randomBytes } from 'node:crypto';
import { remoteRollbackScript } from './deploy-rollback-script.mjs';
import { remoteServerPreamble, runRemoteOperation } from './deploy-server.mjs';
import { isRelease } from './deploy-status.mjs';

export async function rollbackRelease(config, status, options) {
  if (!isRelease(status.current) || !isRelease(status.previous) || status.current === status.previous || status.locked) {
    throw new Error('사용 가능한 이전 정상 릴리스가 없거나 배포 잠금이 있습니다.');
  }
  const stdout = await runRemoteOperation(config, `${remoteServerPreamble}\n${remoteRollbackScript}`, 'rollback', [
    randomBytes(16).toString('hex'), status.current, status.previous,
  ], options);
  if (!stdout.split(/\r?\n/).includes(`OWP_ROLLBACK_OK ${status.previous} ${status.current}`)) {
    throw new Error('rollback 완료 응답이 없습니다. status로 실제 상태를 확인해 주세요.');
  }
  return { current: status.previous, previous: status.current };
}

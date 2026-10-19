import { randomBytes } from 'node:crypto';
import { remoteCleanupFunctions, remoteCleanupScript } from './deploy-cleanup-script.mjs';
import { remoteServerPreamble, runRemoteOperation } from './deploy-server.mjs';
import { isRelease } from './deploy-status.mjs';

export async function cleanupReleases(config, { interactive, run, dryRun = false, approved }) {
  if (approved && approved.some((value) => !isRelease(value) || value === 'initial')) throw new Error('승인한 릴리스 정리 목록이 올바르지 않습니다.');
  const mode = dryRun ? 'dry-run' : 'apply';
  const stdout = await runRemoteOperation(config, `${remoteServerPreamble}\n${remoteCleanupFunctions}\n${remoteCleanupScript}`, 'cleanup', [randomBytes(16).toString('hex'), mode, approved ? approved.join(',') : '*'], { interactive, run });
  if (!stdout.split(/\r?\n/).includes(`OWP_CLEANUP_OK ${mode}`)) throw new Error('릴리스 정리 완료 응답이 없습니다. 서버 상태를 확인해 주세요.');
  const values = (prefix) => stdout.split(/\r?\n/).filter((line) => line.startsWith(prefix)).map((line) => line.slice(prefix.length));
  const candidates = values('OWP_CLEANUP_CANDIDATE ');
  const removed = values('OWP_RELEASE_REMOVED ');
  if ([...candidates, ...removed].some((value) => !isRelease(value))) throw new Error('릴리스 정리 응답이 올바르지 않습니다.');
  return { candidates, removed, dryRun };
}

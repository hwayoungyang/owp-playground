import path from 'node:path';
import { authenticationOptions } from './deploy-preflight.mjs';
import { remoteUploadCommand } from './deploy-transfer.mjs';

export async function stageRelease(config, artifact, uploaded, { interactive, run }) {
  if (uploaded.release !== artifact.release || uploaded.sha256 !== artifact.sha256
    || uploaded.bytes !== artifact.bytes || artifact.metadata?.release !== artifact.release
    || !artifact.release.endsWith(`-${artifact.metadata.commit}`)) {
    throw new Error('업로드한 artifact와 staging 릴리스 메타데이터가 일치하지 않습니다.');
  }
  const command = remoteUploadCommand('stage', config, artifact, uploaded.owner);
  const stdout = await run('ssh', [
    '-p', String(config.sshPort), ...authenticationOptions(config, { interactive }),
    `${config.user}@${config.host}`, command,
  ], { capture: true });
  const receipt = `OWP_RELEASE_STAGED ${artifact.release} ${artifact.sha256} ${artifact.integrity.files}`;
  if (!stdout.split(/\r?\n/).includes(receipt)) {
    throw new Error('서버의 staging 완료 응답을 확인할 수 없습니다. 검증 기록과 임시 경로를 확인해 주세요.');
  }
  return {
    release: artifact.release,
    sha256: artifact.sha256,
    files: artifact.integrity.files,
    directory: path.posix.join(config.remoteRoot, 'releases', `.incoming-${artifact.release}`, 'content'),
  };
}

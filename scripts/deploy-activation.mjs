import path from 'node:path';
import { authenticationOptions } from './deploy-preflight.mjs';
import { remoteUploadCommand } from './deploy-transfer.mjs';

export async function activateRelease(config, artifact, uploaded, staged, { interactive, run, verifyHealth = false }) {
  const incoming = path.posix.join(config.remoteRoot, 'releases', `.incoming-${artifact.release}`);
  if (uploaded.release !== artifact.release || uploaded.sha256 !== artifact.sha256
    || uploaded.bytes !== artifact.bytes || artifact.metadata?.release !== artifact.release
    || !artifact.release.endsWith(`-${artifact.metadata.commit}`)
    || staged.release !== artifact.release || staged.sha256 !== artifact.sha256
    || staged.files !== artifact.integrity?.files || staged.directory !== `${incoming}/content`) {
    throw new Error('전환할 artifact와 staging 릴리스 정보가 일치하지 않습니다.');
  }
  const command = remoteUploadCommand(verifyHealth ? 'deploy' : 'activate', config, artifact, uploaded.owner);
  let stdout;
  try {
    stdout = await run('ssh', [
      '-p', String(config.sshPort), ...authenticationOptions(config, { interactive }),
      `${config.user}@${config.host}`, command,
    ], { capture: true });
  } catch (cause) {
    throw new Error(`current 전환 명령이 완료되지 않았습니다. 재시도 전에 서버의 current와 ${incoming}/.activation.json을 확인해 주세요. ${cause.message}`, { cause });
  }
  const prefix = `OWP_CURRENT_SWITCHED ${artifact.release} ${artifact.sha256} `;
  if (verifyHealth && !stdout.split(/\r?\n/).includes(`OWP_DEPLOY_HEALTH_OK ${artifact.release}`)) {
    throw new Error('서버의 배포 후 HTTP 검증 완료 응답이 없습니다. status로 실제 상태를 확인해 주세요.');
  }
  const receipts = stdout.split(/\r?\n/).filter((line) => line.startsWith(prefix));
  const fields = receipts[0]?.slice(prefix.length).split(' ') ?? [];
  const [previous, previousTarget] = fields;
  if (receipts.length !== 1 || fields.length !== 2
    || !/^(?:initial|\d{8}-\d{6}-[0-9a-f]{7,40})$/.test(previous ?? '') || previous === artifact.release
    || ![`releases/${previous}`, `${config.remoteRoot}/releases/${previous}`].includes(previousTarget)) {
    throw new Error(`서버의 current 전환 완료 응답을 확인할 수 없습니다. 재시도 전에 current와 ${incoming}/.activation.json을 확인해 주세요.`);
  }
  return {
    release: artifact.release,
    sha256: artifact.sha256,
    directory: path.posix.join(config.remoteRoot, 'releases', artifact.release),
    previous,
    previousTarget,
    record: verifyHealth ? `${config.remoteRoot}/.deploy-state/history/${artifact.release}.json` : `${incoming}/.activation.json`,
  };
}

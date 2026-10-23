import { createHash } from 'node:crypto';
import path from 'node:path';
import { readBuildContext } from './deploy-artifact.mjs';
import { collectArchiveFiles } from './version-archive-files.ts';

export async function snapshotInputFingerprint(repoRoot, buildFingerprint) {
  const hash = createHash('sha256').update(buildFingerprint);
  for (const directory of ['scripts', 'knowledge']) {
    const files = await collectArchiveFiles(path.join(repoRoot, directory));
    for (const [relative, fingerprint] of Object.entries(files)) {
      hash.update(`${directory}/${relative}`).update('\0').update(fingerprint.sha256).update('\0');
    }
  }
  return hash.digest('hex');
}

export async function readSnapshotBuildContext(repoRoot) {
  const context = await readBuildContext(repoRoot);
  return { ...context, fingerprint: await snapshotInputFingerprint(repoRoot, context.fingerprint) };
}

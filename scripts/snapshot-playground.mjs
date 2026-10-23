import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { snapshotPlayground } from './version-archive-snapshot.mjs';
import { VersionArchiveError } from './version-archive-files.ts';

async function main() {
  const { values } = parseArgs({ options: {
    draft: { type: 'boolean' }, stable: { type: 'boolean' },
    'archive-root': { type: 'string' }, help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) {
    console.log('사용법: node --experimental-strip-types scripts/snapshot-playground.mjs [--draft | --stable] [--archive-root <경로>]');
    return;
  }
  if (values.draft && values.stable) throw new VersionArchiveError('INVALID_DATA', '--draft와 --stable은 함께 사용할 수 없습니다.');
  const entry = await snapshotPlayground({
    repoRoot: path.resolve(fileURLToPath(new URL('..', import.meta.url))),
    ...(values['archive-root'] ? { archiveRoot: values['archive-root'] } : {}),
    ...(values.draft ? { channel: 'draft' } : values.stable ? { channel: 'stable' } : {}),
  });
  console.log(JSON.stringify({ event: 'version-archive.created', ...entry }, null, 2));
}

try { await main(); }
catch (error) {
  if (error instanceof Error) console.error(error.message);
  else console.error('버전 아카이브를 만들 수 없습니다.');
  process.exitCode = 1;
}

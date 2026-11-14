import { lstat, statfs } from 'node:fs/promises';
import path from 'node:path';

const integer = (value, name, allowZero = false) => {
  if ((typeof value !== 'bigint' && typeof value !== 'string') || !/^\d+$/.test(String(value))) throw new Error(`용량 검사 불가: ${name} counter가 없습니다.`);
  const parsed = BigInt(value);
  if (parsed < (allowZero ? 0n : 1n) || parsed >= 0x7fffffffffffffffn) throw new Error(`용량 검사 불가: ${name} counter가 지원되지 않습니다.`);
  return parsed;
};
export function checkMcpStorage(demands, measurements) {
  const groups = new Map();
  for (const demand of demands) {
    const sample = measurements.find((entry) => entry.path === demand.path);
    if (!sample) throw new Error(`용량 검사 불가: 파일시스템 측정이 없습니다: ${demand.path}`);
    const dev = integer(sample.dev, 'dev', true).toString();
    const frsize = integer(sample.frsize ?? sample.bsize, 'frsize');
    const bsize = integer(sample.bsize, 'bsize');
    const unit = frsize > bsize ? frsize : bsize;
    const blocks = integer(sample.blocks, 'blocks');
    const available = integer(sample.bavail, 'bavail', true);
    const files = integer(sample.files, 'files');
    const free = integer(sample.ffree, 'ffree', true);
    if (available > blocks || free > files) throw new Error('용량 검사 불가: 파일시스템 counter가 서로 다릅니다.');
    const payload = integer(demand.bytes, 'payload', true);
    const entries = integer(demand.entries, 'entries', true);
    // 각 항목의 반올림·directory/link metadata에 allocation unit 두 개를 더합니다.
    const bytes = ((payload + entries * unit * 2n) * 6n + 4n) / 5n;
    const inodes = (entries * 6n + 4n) / 5n;
    const availableBytes = available * (frsize < bsize ? frsize : bsize);
    const group = groups.get(dev) ?? { dev, requiredBytes: 0n, requiredInodes: 0n, availableBytes, availableInodes: free, paths: [] };
    group.requiredBytes += bytes;
    group.requiredInodes += inodes;
    if (availableBytes < group.availableBytes) group.availableBytes = availableBytes;
    if (free < group.availableInodes) group.availableInodes = free;
    group.paths.push(demand.path);
    groups.set(dev, group);
  }
  for (const group of groups.values()) {
    if (group.requiredBytes > group.availableBytes) throw new Error(`배포 용량 부족: dev ${group.dev}, 필요 ${group.requiredBytes} bytes, 사용 가능 ${group.availableBytes} bytes`);
    if (group.requiredInodes > group.availableInodes) throw new Error(`배포 inode 부족: dev ${group.dev}, 필요 ${group.requiredInodes}, 사용 가능 ${group.availableInodes}`);
  }
  return [...groups.values()].map((group) => Object.fromEntries(Object.entries(group).map(([name, value]) => [name, typeof value === 'bigint' ? value.toString() : value])));
}

export async function measureMcpStorage(demands, dependencies = {}) {
  const inspect = dependencies.lstat ?? ((file) => lstat(file, { bigint: true }));
  const filesystem = dependencies.statfs ?? ((file) => statfs(file, { bigint: true }));
  const measurements = [];
  for (const { path: destination } of demands) {
    let ancestor = path.parse(destination).root;
    for (const part of destination.slice(ancestor.length).split(path.sep).filter(Boolean)) {
      const next = path.join(ancestor, part);
      let info;
      try { info = await inspect(next); }
      catch (error) { if (error.code === 'ENOENT') break; throw error; }
      if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`용량 검사에는 실제 디렉터리가 필요합니다: ${next}`);
      ancestor = next;
    }
    const before = await inspect(ancestor);
    const stats = await filesystem(ancestor);
    const after = await inspect(ancestor);
    if (before.dev !== after.dev || before.ino !== after.ino) throw new Error('용량 검사 중 파일시스템 경로가 바뀌었습니다.');
    measurements.push({ path: destination, dev: String(after.dev), ...Object.fromEntries(['bsize', 'frsize', 'blocks', 'bavail', 'files', 'ffree'].filter((key) => stats[key] !== undefined).map((key) => [key, String(stats[key])])) });
  }
  return measurements;
}

export async function assertMcpStorage(demands, dependencies) {
  return checkMcpStorage(demands, await measureMcpStorage(demands, dependencies));
}

export function mcpTreeDemand(entries, kind = 'tar') {
  const directories = new Set(['']);
  let bytes = 0n;
  let files = 0n;
  for (const entry of entries) {
    const name = kind === 'tar' ? entry.name : entry.path;
    const directory = kind === 'tar' ? entry.directory : entry.type === 'directory';
    if (directory) directories.add(name);
    else {
      files++;
      bytes += BigInt(kind === 'tar' ? entry.content.length : entry.type === 'symlink' ? Buffer.byteLength(entry.target) : entry.bytes);
    }
    let parent = path.posix.dirname(name);
    while (parent !== '.') { directories.add(parent); parent = path.posix.dirname(parent); }
  }
  return { bytes: bytes.toString(), entries: (files + BigInt(directories.size)).toString() };
}

export function mcpDeploymentDemands(plan, inspected, phase = 'transfer') {
  const root = plan.config.remoteRoot;
  const demand = (destination, bytes, entries) => ({ path: destination, bytes: String(bytes), entries: String(entries) });
  const sum = (entries) => entries.reduce((total, entry) => total + BigInt(entry.bytes), 0n);
  const controls = plan.files?.filter((entry) => entry.name.startsWith('deploy-mcp-')) ?? [];
  const runtime = plan.runtimeReused ? [] : ['runtime-node', 'runtime-pnpm'].map((name) => plan.offline?.files[name]).filter(Boolean);
  const metadataBytes = BigInt(Buffer.byteLength(JSON.stringify(plan))) * 8n;
  // 64 KiB 단일 삭제 intent와 atomic write 임시 사본을 root에 남깁니다.
  const cleanupBytes = 2n * 64n * 1024n;
  if (phase === 'bootstrap') return [
    demand(root, sum(controls) + metadataBytes + cleanupBytes, controls.length + 18),
    demand(`${root}/.incoming-${plan.owner}`, sum(runtime), runtime.length + 2),
    demand(`${root}/runtime`, sum(runtime), runtime.length + 5),
  ];
  const app = mcpTreeDemand(inspected.app.entries);
  const archive = mcpTreeDemand(inspected.archive.entries);
  const dependencies = inspected.dependencies ? mcpTreeDemand(inspected.dependencies.entries, 'dependencies') : { bytes: '0', entries: '1' };
  const index = inspected.archive.entries.find((entry) => entry.name === 'versions/index.json');
  return [
    demand(root, metadataBytes + cleanupBytes + BigInt(index?.content.length ?? 0) * 12n, 34),
    demand(plan.config.unitDirectory, metadataBytes, 4),
    ...(phase === 'transfer' ? [demand(`${root}/.incoming-${plan.owner}`, sum(plan.files ?? []), (plan.files?.length ?? 0) + 1)] : []),
    demand(`${root}/apps`, BigInt(app.bytes) + BigInt(dependencies.bytes), BigInt(app.entries) + BigInt(dependencies.entries) + 1n),
    demand(`${root}/.incoming-${plan.owner}`, archive.bytes, archive.entries),
    demand(`${root}/archive/versions`, archive.bytes, archive.entries),
  ];
}

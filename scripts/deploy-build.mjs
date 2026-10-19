import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export async function validateBuild(directory) {
  const root = path.resolve(directory);
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    throw new Error('dist는 symlink가 아닌 디렉터리여야 합니다.');
  }

  const files = new Map();
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(target);
      } else if (entry.isFile()) {
        files.set(path.relative(root, target), (await lstat(target)).size);
      } else {
        throw new Error(`dist에 일반 파일·디렉터리가 아닌 항목이 있습니다: ${path.relative(root, target)}`);
      }
    }
  }
  await walk(root);

  for (const required of ['index.html', 'robots.txt', 'packages.json']) {
    if (!(files.get(required) > 0)) throw new Error(`빌드 필수 파일이 없거나 비어 있습니다: ${required}`);
  }
  const assets = [...files.keys()].filter((file) => file.startsWith(`assets${path.sep}`));
  for (const extension of ['.js', '.css']) {
    if (!assets.some((file) => file.endsWith(extension) && files.get(file) > 0)) {
      throw new Error(`dist/assets에 ${extension} 파일이 없습니다.`);
    }
  }

  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const references = [...html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)];
  for (const [, reference] of references) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) continue;
    const url = new URL(reference, 'http://build-check.local/');
    const target = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!target.startsWith(`${root}${path.sep}`) || !(files.get(path.relative(root, target)) > 0)) {
      throw new Error(`index.html에서 참조한 파일이 없거나 비어 있습니다: ${reference}`);
    }
  }

  const catalog = JSON.parse(await readFile(path.join(root, 'packages.json'), 'utf8'));
  if (!Array.isArray(catalog.packages) || catalog.packages.length === 0) {
    throw new Error('packages.json의 packages 목록이 없거나 비어 있습니다.');
  }

  return { files: files.size, assets: assets.length, bytes: [...files.values()].reduce((sum, size) => sum + size, 0) };
}

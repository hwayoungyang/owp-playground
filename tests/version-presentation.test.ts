import { describe, expect, it } from 'vitest';
import {
  createVersionPresentation,
  fileFingerprint,
  versionPresentationEntry,
  type VersionUiRuntime,
} from '../scripts/version-presentation.ts';
import { releaseIndexEntrySchema } from '../src/features/releases/model/schema';

const release = releaseIndexEntrySchema.parse({
  releaseId: 'old-release',
  createdAt: '2026-10-23T03:00:00.000Z',
  basePath: '/versions/old-release/',
  packages: [{ id: 'datagrid', name: '@owp/datagrid', version: '3.5.0' }],
  channel: 'stable',
  manifestSha256: '1'.repeat(64),
});
const runtime: VersionUiRuntime = {
  basePath: '/versions/new-release/',
  fingerprint: '2'.repeat(64),
  descriptor: {
    schemaVersion: 1,
    entry: { path: 'assets/version-menu-abc123.js', bytes: 1, sha256: '3'.repeat(64) },
  },
};

describe('archive HTML presentation', () => {
  it('installs the capture gate before archived modules while preserving their exact markup', () => {
    // Given
    const app = '<script type="module" src="/versions/old-release/assets/old.js"></script>';
    const raw = Buffer.from(
      `<!doctype html><html><head><meta charset="UTF-8">${app}</head><body><div id="root"></div></body></html>`,
    );
    // When
    const html = createVersionPresentation(raw, release, runtime).toString('utf8');
    // Then
    expect(html.indexOf('data-version-ui')).toBeLessThan(html.indexOf(app));
    expect(
      Buffer.byteLength(
        html.slice(0, html.indexOf('<meta charset="UTF-8">') + '<meta charset="UTF-8">'.length),
      ),
    ).toBeLessThanOrEqual(1024);
    expect(html.replace(/<script data-version-ui[^>]*>[\s\S]*?<\/script>/, '')).toBe(
      raw.toString('utf8'),
    );
    expect(html).toContain('/versions/new-release/assets/version-menu-abc123.js');
  });

  it('keeps raw and presentation SHA contracts separate for the displayed old release', () => {
    // Given
    const raw = Buffer.from('<!doctype html><head></head>');
    // When
    const entry = versionPresentationEntry(raw, release, runtime);
    // Then
    expect(entry.raw).toEqual(fileFingerprint(raw));
    expect(entry.presentation.sha256).not.toBe(entry.raw.sha256);
    expect(entry.rawPath).toBe('/version-ui/raw/old-release/index.html');
    expect(entry.release.packages[0]?.version).toBe('3.5.0');
    expect(entry.runtimeFingerprint).toBe(runtime.fingerprint);
  });

  it('rejects a second projection instead of registering two capture gates', () => {
    // Given
    const projected = createVersionPresentation(Buffer.from('<head></head>'), release, runtime);
    // When / Then
    expect(() => createVersionPresentation(projected, release, runtime)).toThrow(TypeError);
  });

  it('preserves JSON values when escaping script delimiters in runtime configuration', () => {
    // Given
    const unsafe = { ...runtime, basePath: '/</script>/' };
    // When
    const html = createVersionPresentation(Buffer.from('<head></head>'), release, unsafe).toString(
      'utf8',
    );
    const serialized = /\}\)\((\{.*\})\);<\/script>/.exec(html)?.[1];
    // Then
    expect(serialized).toBeDefined();
    expect(JSON.parse(serialized ?? '{}').module).toBe('/</script>/assets/version-menu-abc123.js');
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { loadPublicApiEntry } from '../src/features/public-api/loader';

const { selected, other, failed } = vi.hoisted(() => ({
  selected: vi.fn(async () => ({ id: 'selected' })),
  other: vi.fn(async () => ({ id: 'other' })),
  failed: vi.fn(async () => {
    throw new Error('API chunk unavailable');
  }),
}));
vi.mock('virtual:public-api/components/entries', () => ({
  default: { selected, other, failed },
}));

describe('API entry loading', () => {
  it('loads only the selected entry and reuses its promise on repeat visits', async () => {
    const first = loadPublicApiEntry('components', 'selected');
    expect(loadPublicApiEntry('components', 'selected')).toBe(first);
    await expect(first).resolves.toEqual({ id: 'selected' });
    expect(selected).toHaveBeenCalledTimes(1);
    expect(other).not.toHaveBeenCalled();
  });

  it('does not fetch unrelated entries for a missing symbol', async () => {
    await expect(loadPublicApiEntry('components', 'missing')).resolves.toBeUndefined();
    expect(other).not.toHaveBeenCalled();
  });

  it('propagates chunk failures without starting an automatic request loop', async () => {
    const first = loadPublicApiEntry('components', 'failed');
    await expect(first).rejects.toThrow('API chunk unavailable');
    expect(loadPublicApiEntry('components', 'failed')).toBe(first);
    expect(failed).toHaveBeenCalledTimes(1);
  });
});

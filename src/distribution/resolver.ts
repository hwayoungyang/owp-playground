import type { DistributionContext, DistributionProfile } from './schema.ts';

export type DistributionSelection =
  | { readonly status: 'selected'; readonly profile: DistributionProfile }
  | { readonly status: 'unknown'; readonly profileId: string };

/** Query는 내부 상태 표시용 프로필만 선택하며 runtime module graph는 바꾸지 않습니다. */
export function resolveDistributionProfile(
  context: DistributionContext,
  profileId = context.defaultProfileId,
): DistributionSelection {
  const profile = context.profiles.find((entry) => entry.id === profileId);
  return profile ? { status: 'selected', profile } : { status: 'unknown', profileId };
}

export function verifiedPreviewUrl(profile: DistributionProfile): string | null {
  return profile.audience === 'company' &&
    profile.manifestStatus === 'verified' &&
    profile.runtimeStatus === 'verified'
    ? profile.previewUrl
    : null;
}

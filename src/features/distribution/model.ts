import type {
  DistributionContext,
  DistributionProfile,
  DistributionTarget,
} from '../../distribution/schema';
import { distributionContextSchema, isolatedPreviewUrlSchema } from '../../distribution/schema';

export function distributionContext(): DistributionContext | undefined {
  return typeof __OWP_DISTRIBUTION__ === 'undefined' ? undefined : __OWP_DISTRIBUTION__;
}

export function isDistributionContext(value: unknown): value is DistributionContext {
  return distributionContextSchema.safeParse(value).success;
}

export function selectDistributionProfile(context: DistributionContext, search: string) {
  const query = new URLSearchParams(search);
  if (query.getAll('buildId').length > 1) return null;
  const requested =
    context.mode === 'internal'
      ? (query.get('profile') ?? context.defaultProfileId)
      : context.defaultProfileId;
  const profile = context.profiles.find((entry) => entry.id === requested);
  if (!profile || (context.mode === 'company' && profile.audience !== 'company')) return null;
  const requestedBuild = query.get('buildId');
  if (requestedBuild !== null) {
    if (profile.audience !== 'company') return null;
    const builds = profileTargets(profile);
    const matches = builds.filter(
      (build) => build.buildId === requestedBuild && build.companyId === profile.companyId,
    );
    const target = matches[0];
    if (matches.length !== 1 || !target) return null;
    return { ...profile, ...target, builds: builds.filter((build) => build !== target) };
  }
  return profile;
}

export function profileTargets(profile: DistributionProfile): readonly DistributionTarget[] {
  return [profile, ...profile.builds];
}

export function profileSelectionUrl(currentHref: string, profileId: string): URL {
  const current = new URL(currentHref);
  const target = new URL(current.pathname, current.origin);
  for (const key of ['lang', 'colorMode']) {
    const value = current.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  target.searchParams.set('profile', profileId);
  return target;
}

export function hasVerifiedPreview(profile: DistributionTarget): boolean {
  return (
    profile.audience === 'company' &&
    profile.manifestStatus === 'verified' &&
    profile.runtimeStatus === 'verified' &&
    Boolean(
      profile.companyId &&
      profile.buildId &&
      profile.manifestDigest &&
      profile.releaseId &&
      profile.bundleDigest &&
      profile.buildDigest &&
      profile.previewDigest &&
      profile.previewUrl,
    ) &&
    profile.issues.length === 0 &&
    isolatedPreviewUrlSchema.safeParse(profile.previewUrl).success &&
    profile.previewUrl ===
      `/company-previews/${profile.companyId}/${profile.previewDigest}/index.html`
  );
}

export function companyPreviewUrl(profile: DistributionTarget, currentHref: string): URL | null {
  if (!hasVerifiedPreview(profile) || !profile.previewUrl) return null;
  const current = new URL(currentHref);
  const target = new URL(profile.previewUrl, current);
  if (
    target.origin !== current.origin ||
    !['http:', 'https:'].includes(target.protocol) ||
    target.pathname === current.pathname
  )
    return null;
  for (const key of ['lang', 'colorMode']) {
    const value = current.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  target.hash = '';
  return target;
}

export type ProviderFeature = {
  readonly owner: string;
  readonly name: string;
  readonly modules: readonly string[];
  readonly member?: string;
  readonly asset?: boolean;
};

export function providerFeatureIds(feature: ProviderFeature): readonly string[] {
  if (!/^@owp\/[a-z][a-z0-9-]*$/.test(feature.owner)) return [];
  const packageId = feature.owner.slice('@owp/'.length);
  const symbol = feature.member ? `${feature.name}.${feature.member}` : feature.name;
  if (!feature.asset && !/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(symbol)) return [];
  return [
    ...new Set(
      feature.modules.flatMap((module) => {
        if (module !== feature.owner && !module.startsWith(`${feature.owner}/`)) return [];
        const subpath = module === feature.owner ? '.' : module.slice(feature.owner.length + 1);
        if (!/^(?:\.|[A-Za-z0-9_./-]+)$/.test(subpath) || subpath.includes('*')) return [];
        return [
          feature.asset
            ? `${packageId}:${subpath}`
            : subpath === '.'
              ? `${packageId}:${symbol}`
              : `${packageId}:${subpath}:${symbol}`,
        ];
      }),
    ),
  ];
}

export function historicalInclusion(profile: DistributionTarget, featureId: string) {
  if (
    profile.audience !== 'company' ||
    profile.manifestStatus !== 'verified' ||
    !profile.companyId ||
    !profile.buildId ||
    !profile.manifestDigest
  )
    return 'unconfirmed';
  return profile.features.includes(featureId) ? 'included' : 'not-included';
}

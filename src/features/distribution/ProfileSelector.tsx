import { useOwpTranslation } from '@owp/components/hooks';
import { Button, Menu, MenuItem } from '@mui/material';
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import type { DistributionContext, DistributionProfile } from '../../distribution/schema';
import {
  companyPreviewUrl,
  hasVerifiedPreview,
  profileSelectionUrl,
  profileTargets,
} from './model';

export function ProfileSelector({
  context,
  selected,
  colorMode,
}: {
  readonly context: DistributionContext;
  readonly selected: DistributionProfile | null;
  readonly colorMode?: 'light' | 'dark';
}) {
  const { t } = useOwpTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  const profileLabel = (profile: DistributionProfile) =>
    profile.audience === 'full' && profile.label === profile.id ? t('전체판') : profile.label;
  if (context.mode !== 'internal') return null;
  return (
    <>
      <Button
        className="distribution-selector"
        aria-label={t('배포 대상 선택')}
        aria-haspopup="menu"
        aria-controls={anchor ? id : undefined}
        aria-expanded={Boolean(anchor)}
        endIcon={<CaretDownIcon size={12} />}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {t('배포 대상')}: {selected ? profileLabel(selected) : t('사용 불가')}
      </Button>
      <Menu id={id} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {context.profiles.map((profile) => (
          <MenuItem
            key={profile.id}
            selected={selected?.id === profile.id}
            aria-current={selected?.id === profile.id ? 'true' : undefined}
            onClick={() => {
              setAnchor(null);
              if (selected?.id === profile.id) return;
              const target =
                companyPreviewUrl(profile, location.href) ??
                profileSelectionUrl(location.href, profile.id);
              if (colorMode) target.searchParams.set('colorMode', colorMode);
              location.assign(target.href);
            }}
          >
            <span className="distribution-profile-label">{profileLabel(profile)}</span>
            {selected?.id === profile.id && <CheckIcon size={14} aria-hidden />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export function CompanyVersionMenu({
  profile,
  colorMode,
}: {
  readonly profile: DistributionProfile;
  readonly colorMode?: 'light' | 'dark';
}) {
  const { t } = useOwpTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  const builds = profileTargets(profile).filter(
    (build) => build.companyId === profile.companyId && hasVerifiedPreview(build),
  );
  return (
    <>
      <Button
        className="distribution-selector"
        aria-label={t('빌드 버전 선택')}
        disabled={builds.length === 0}
        aria-haspopup="menu"
        aria-controls={anchor ? id : undefined}
        aria-expanded={Boolean(anchor)}
        endIcon={<CaretDownIcon size={12} />}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {t(builds.length ? '빌드 버전 선택' : '미리보기 준비 중')}
      </Button>
      <Menu id={id} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {builds.map((build) => (
          <MenuItem
            key={build.buildId}
            onClick={() => {
              setAnchor(null);
              const target = companyPreviewUrl(build, location.href);
              if (!target) return;
              if (colorMode) target.searchParams.set('colorMode', colorMode);
              location.assign(target.href);
            }}
          >
            <span className="distribution-profile-label distribution-build-label">
              {build.label} · {build.buildId} · {build.releaseId}
            </span>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

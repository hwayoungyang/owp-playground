import { useOwpTranslation } from '@owp/components/hooks';
import { OwpTable } from '@owp/components';
import { Alert, Button } from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import type {
  DistributionContext,
  DistributionProfile,
  DistributionTarget,
} from '../../distribution/schema';
import { Provider } from '../../app/providers/Provider';
import { CompanyVersionMenu, ProfileSelector } from './ProfileSelector';
import {
  companyPreviewUrl,
  distributionContext,
  isDistributionContext,
  selectDistributionProfile,
  profileTargets,
  hasVerifiedPreview,
} from './model';
import './distribution.css';

const manifestLabels = {
  'not-required': 'Manifest 불필요',
  verified: 'Manifest 확인됨',
  missing: 'Manifest 없음',
  invalid: 'Manifest 유효하지 않음',
} as const;
const runtimeLabels = {
  installed: '개발 환경에 패키지 설치됨',
  unconfigured: '런타임 미설정',
  verified: '패키지 파일·메타데이터 확인됨',
  missing: '런타임 없음',
  mismatch: '런타임 식별 정보 불일치',
} as const;
const issueLabels: Readonly<Record<string, string>> = {
  'runtime-unconfigured': '런타임 descriptor가 연결되지 않았습니다.',
  'runtime-identity-mismatch': '런타임과 Manifest의 고객사·빌드·digest가 일치하지 않습니다.',
  'runtime-package-set-mismatch': '런타임의 패키지 목록이 Manifest와 일치하지 않습니다.',
  'runtime-package-missing': '필수 패키지가 없습니다.',
  'runtime-metadata-mismatch': '패키지의 버전 또는 배포 metadata가 일치하지 않습니다.',
  'artifact-contract-unverified': 'Framework artifact digest 계약 adapter가 연결되지 않았습니다.',
  'runtime-digest-mismatch': '패키지 파일의 digest가 일치하지 않습니다.',
  'preview-digest-mismatch': '분리된 미리보기의 파일 목록 또는 digest가 일치하지 않습니다.',
  'runtime-metadata-invalid': '런타임의 metadata 형식이 유효하지 않습니다.',
  'runtime-file-missing': '런타임의 필수 파일이 없습니다.',
  'manifest-missing': '제공 Manifest가 없습니다.',
  'manifest-invalid': '제공 Manifest 형식이 유효하지 않습니다.',
  'manifest-digest-mismatch': '제공 Manifest의 digest가 일치하지 않습니다.',
  'company-mismatch': '프로필과 Manifest의 고객사가 일치하지 않습니다.',
  'package-identity-mismatch': '패키지 ID와 이름이 일치하지 않습니다.',
};

export function ProfilePackages({ profile }: { readonly profile: DistributionTarget }) {
  const { t } = useOwpTranslation();
  if (profile.packages.length === 0) return <p>{t('패키지 버전 미확인')}</p>;
  return (
    <OwpTable
      containerProps={{
        className: 'distribution-table-scroll',
        role: 'region',
        'aria-label': t('제공 빌드의 패키지 버전'),
        tabIndex: 0,
      }}
      className="distribution-table"
      size="small"
      aria-label={t('제공 빌드의 패키지 버전')}
      headers={{ name: t('패키지'), base: t('기준 버전'), version: t('고객사 빌드 버전') }}
      rows={profile.packages.map((pkg) => ({
        name: <code>{pkg.name}</code>,
        base: pkg.baseVersion ?? t('미확인'),
        version: pkg.version,
      }))}
    />
  );
}

function ProfileStatus({
  context,
  profile,
}: {
  readonly context: DistributionContext | null;
  readonly profile: DistributionProfile | null;
}) {
  const { t, i18n } = useOwpTranslation();
  const preview =
    profile && typeof location !== 'undefined' ? companyPreviewUrl(profile, location.href) : null;
  const [mode, setMode] = useState<'light' | 'dark'>(() =>
    typeof location !== 'undefined' &&
    new URLSearchParams(location.search).get('colorMode') === 'dark'
      ? 'dark'
      : 'light',
  );
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.title = `${t(profile ? '배포 준비 상태' : '배포 프로필을 사용할 수 없습니다.')} — OWP Playground`;
  }, [i18n.language, profile, t]);
  return (
    <Provider mode={mode}>
      <div className="distribution-shell">
        <a className="skip-link" href="#main-content">
          {t('본문으로 이동')}
        </a>
        <header className="app-header distribution-header">
          <span className="brand">
            OWP <b>Playground</b>
          </span>
          <div className="header-actions">
            {context && <ProfileSelector context={context} selected={profile} colorMode={mode} />}
            {profile?.audience === 'company' && (
              <CompanyVersionMenu profile={profile} colorMode={mode} />
            )}
            <Button
              aria-label={t(i18n.language === 'en' ? '한국어로 전환' : '영어로 전환')}
              onClick={() => {
                const next = i18n.language === 'en' ? 'ko' : 'en';
                void i18n.changeLanguage(next);
                const url = new URL(location.href);
                url.searchParams.set('lang', next);
                history.replaceState(null, '', url);
              }}
            >
              {i18n.language === 'en' ? '한' : 'EN'}
            </Button>
            <Button
              onClick={() => {
                const next = mode === 'light' ? 'dark' : 'light';
                setMode(next);
                const url = new URL(location.href);
                url.searchParams.set('colorMode', next);
                history.replaceState(null, '', url);
              }}
            >
              {t(mode === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환')}
            </Button>
          </div>
        </header>
        <main className="distribution-status" id="main-content" tabIndex={-1}>
          <h1>{t(profile ? '배포 준비 상태' : '배포 프로필을 사용할 수 없습니다.')}</h1>
          {!profile ? (
            <Alert severity="error">
              {t(
                '요청한 프로필 또는 배포 설정이 유효하지 않습니다. 배포 대상을 다시 선택해 주세요.',
              )}
            </Alert>
          ) : (
            <>
              <p>
                {t('이 화면은 내부 준비 상태입니다. 앱의 실행·납품·설치를 확인한 결과가 아닙니다.')}
              </p>
              <dl className="distribution-facts">
                <div>
                  <dt>{t('고객사')}</dt>
                  <dd>
                    {context?.profiles.find((entry) => entry.id === profile.id)?.label ??
                      profile.label}
                  </dd>
                </div>
                <div>
                  <dt>{t('제공 빌드')}</dt>
                  <dd>
                    <code>{profile.buildId ?? t('미확인')}</code>
                  </dd>
                </div>
                <div>
                  <dt>Manifest</dt>
                  <dd>{t(manifestLabels[profile.manifestStatus])}</dd>
                </div>
                <div>
                  <dt>{t('런타임')}</dt>
                  <dd>{t(runtimeLabels[profile.runtimeStatus])}</dd>
                </div>
              </dl>
              <Alert severity={preview ? 'info' : 'warning'}>
                {t(
                  preview
                    ? '분리된 미리보기로 이동할 수 있습니다. 브라우저 실행 검증은 별도로 필요합니다.'
                    : '식별 정보가 일치하는 분리된 미리보기가 준비되지 않았습니다. 전체 예제·API는 이 프로필에서 실행하지 않습니다.',
                )}
              </Alert>
              {profile.issues.length > 0 && (
                <ul className="distribution-blockers">
                  {profile.issues.map((issue, index) => (
                    <li key={`${issue.code}-${index}`}>
                      {t(
                        issueLabels[issue.code] ??
                          '배포 검증을 완료하지 못했습니다. 내부 설정을 확인해 주세요.',
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <ProfilePackages profile={profile} />
              <OwpTable
                containerProps={{
                  className: 'distribution-table-scroll',
                  role: 'region',
                  'aria-label': t('빌드 준비 상태'),
                  tabIndex: 0,
                }}
                className="distribution-table"
                size="small"
                aria-label={t('빌드 준비 상태')}
                headers={{
                  label: t('빌드 이름'),
                  build: t('제공 빌드'),
                  release: t('Release'),
                  manifest: 'Manifest',
                  runtime: t('런타임'),
                  preview: t('미리보기'),
                }}
                rows={profileTargets(profile).map((build) => ({
                  label: build.label,
                  build: <code>{build.buildId ?? t('미확인')}</code>,
                  release: <code>{build.releaseId ?? t('미확인')}</code>,
                  manifest: t(manifestLabels[build.manifestStatus]),
                  runtime: t(runtimeLabels[build.runtimeStatus]),
                  preview: t(hasVerifiedPreview(build) ? '정적 검증 완료' : '준비 중'),
                }))}
              />
              <p>{t('제공된 빌드의 기록이며 현재 정책의 최신 승인을 뜻하지 않습니다.')}</p>
              {preview && (
                <Button variant="outlined" onClick={() => location.assign(preview.href)}>
                  {t('분리된 미리보기 열기')}
                </Button>
              )}
            </>
          )}
        </main>
      </div>
    </Provider>
  );
}

export function DistributionBoundary({
  children,
  context = distributionContext(),
  search,
}: {
  readonly children: ReactNode;
  readonly context?: unknown;
  readonly search?: string;
}) {
  const [currentSearch, setCurrentSearch] = useState(
    () => search ?? (typeof location === 'undefined' ? '' : location.search),
  );
  useEffect(() => {
    const sync = () => setCurrentSearch(location.search);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  if (context === undefined && typeof window === 'undefined') return children;
  if (!isDistributionContext(context)) return <ProfileStatus context={null} profile={null} />;
  const profile = selectDistributionProfile(context, search ?? currentSearch);
  if (
    context.mode === 'internal' &&
    profile?.audience === 'full' &&
    profile.runtimeSource === 'installed' &&
    profile.runtimeStatus === 'installed' &&
    profile.manifestStatus === 'not-required' &&
    profile.companyId === null &&
    profile.buildId === null &&
    profile.manifestDigest === null &&
    profile.previewUrl === null &&
    profile.issues.length === 0
  )
    return children;
  return (
    <ProfileStatus context={context} profile={profile?.audience === 'company' ? profile : null} />
  );
}

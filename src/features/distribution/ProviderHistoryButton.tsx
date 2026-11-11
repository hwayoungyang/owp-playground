import { useOwpTranslation } from '@owp/components/hooks';
import { OwpTable } from '@owp/components';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useId, useState } from 'react';
import type { DistributionContext, DistributionProfile } from '../../distribution/schema';
import { ProfilePackages } from './DistributionBoundary';
import {
  distributionContext,
  historicalInclusion,
  isDistributionContext,
  providerFeatureIds,
  profileTargets,
  type ProviderFeature,
} from './model';

const inclusionLabels = {
  included: '이 제공 빌드에 포함됨',
  'not-included': '이 제공 빌드에 포함되지 않음',
  unconfirmed: 'Manifest 포함 여부 미확인',
} as const;
const historyLabels = {
  unknown: '이력 미설정',
  verified: '이력 입력 확인됨',
  missing: '이력 파일 없음',
  invalid: '이력 유효하지 않음',
} as const;
const eventLabels = {
  build: '빌드',
  validation: '빌드 검증',
  'archive-validation': '아카이브 검증',
  delivery: '납품',
  install: '설치',
  defect: '결함',
  replacement: '대체',
  rollback: '롤백',
} as const;

function HistoryRecords({
  profile,
  owner,
}: {
  readonly profile: DistributionProfile;
  readonly owner: string;
}) {
  const { t } = useOwpTranslation();
  const history = profile.history;
  const events = history?.events ?? [];
  const targets = profileTargets(profile);
  const confirmedInstallations =
    history?.status === 'verified' && history.installStatus === 'confirmed'
      ? history.installations.flatMap((installation) => {
          if (!installation.manifestMatched) return [];
          const builds = targets.filter(
            (target) =>
              target.audience === 'company' &&
              target.manifestStatus === 'verified' &&
              target.companyId !== null &&
              target.companyId === profile.companyId &&
              target.buildId === installation.buildId &&
              target.manifestDigest !== null,
          );
          const build = builds[0];
          if (builds.length !== 1 || !build) return [];
          const packages = build.packages.filter((pkg) => pkg.name === owner);
          const pkg = packages[0];
          return packages.length === 1 && pkg ? [{ ...installation, version: pkg.version }] : [];
        })
      : [];
  const columns = {
    timestamp: t('기록 시각'),
    type: t('이벤트'),
    status: t('기록 상태'),
    build: t('제공 빌드'),
    delivery: t('납품 ID'),
    project: t('프로젝트 ID'),
  };
  const rows = (selected: typeof events) =>
    selected.map((event) => ({
      timestamp: <time dateTime={event.timestamp}>{event.timestamp}</time>,
      type: t(eventLabels[event.type]),
      status: t(event.status === 'failed' ? '실패' : '기록 확인됨'),
      build: <code>{event.buildId ?? t('미확인')}</code>,
      delivery: <code>{event.deliveryId ?? '—'}</code>,
      project: <code>{event.projectId ?? '—'}</code>,
    }));
  return (
    <>
      <dl className="distribution-facts">
        <div>
          <dt>{t('이력 입력')}</dt>
          <dd>{t(historyLabels[history?.status ?? 'unknown'])}</dd>
        </div>
        <div>
          <dt>{t('납품 이력')}</dt>
          <dd>{t(history?.deliveryStatus === 'confirmed' ? '확인됨' : '미확인')}</dd>
        </div>
        <div>
          <dt>{t('소비앱 설치')}</dt>
          <dd>{t(confirmedInstallations.length > 0 ? '확인됨' : '미확인')}</dd>
        </div>
        <div>
          <dt>{t('기능 사용')}</dt>
          <dd>{t('미확인')}</dd>
        </div>
      </dl>
      <p>
        {t(
          '이력은 빌드 단위 기록입니다. 선택한 기능의 포함 여부는 각 Manifest에서 별도로 확인합니다.',
        )}
      </p>
      <h4>{t('현재 설치 확인')}</h4>
      <p>
        {t(
          '등록된 Manifest와 일치하는 소유 패키지의 설치만 확인합니다. 일치하지 않는 기록은 현재 설치를 확인하지 않습니다.',
        )}
      </p>
      {confirmedInstallations.length > 0 ? (
        <OwpTable
          containerProps={{
            className: 'distribution-table-scroll',
            role: 'region',
            'aria-label': t('프로젝트별 설치 확인'),
            tabIndex: 0,
          }}
          className="distribution-table"
          size="small"
          aria-label={t('프로젝트별 설치 확인')}
          headers={{
            project: t('프로젝트 ID'),
            delivery: t('납품 ID'),
            build: t('제공 빌드'),
            version: t('설치 패키지 버전'),
          }}
          rows={confirmedInstallations.map((installation) => ({
            project: <code>{installation.projectId}</code>,
            delivery: <code>{installation.deliveryId}</code>,
            build: <code>{installation.buildId}</code>,
            version: installation.version,
          }))}
        />
      ) : (
        <p>{t('현재 설치를 확인할 기록이 없습니다.')}</p>
      )}
      <h4>{t('빌드·검증·납품·설치 기록')}</h4>
      {events.some((event) => !['defect', 'replacement', 'rollback'].includes(event.type)) ? (
        <OwpTable
          containerProps={{
            className: 'distribution-table-scroll',
            role: 'region',
            'aria-label': t('빌드·검증·납품·설치 기록'),
            tabIndex: 0,
          }}
          className="distribution-table"
          size="small"
          aria-label={t('빌드·검증·납품·설치 기록')}
          headers={columns}
          rows={rows(
            events.filter((event) => !['defect', 'replacement', 'rollback'].includes(event.type)),
          )}
        />
      ) : (
        <p>{t('확인할 이력 이벤트가 없습니다.')}</p>
      )}
      <h4>{t('결함·대체·롤백 기록')}</h4>
      {events.some((event) => ['defect', 'replacement', 'rollback'].includes(event.type)) ? (
        <OwpTable
          containerProps={{
            className: 'distribution-table-scroll',
            role: 'region',
            'aria-label': t('결함·대체·롤백 기록'),
            tabIndex: 0,
          }}
          className="distribution-table"
          size="small"
          aria-label={t('결함·대체·롤백 기록')}
          headers={columns}
          rows={rows(
            events.filter((event) => ['defect', 'replacement', 'rollback'].includes(event.type)),
          )}
        />
      ) : (
        <p>{t('확인할 이력 이벤트가 없습니다.')}</p>
      )}
    </>
  );
}

export function ProviderHistoryContent({
  feature,
  context,
}: {
  readonly feature: ProviderFeature;
  readonly context: DistributionContext;
}) {
  const { t } = useOwpTranslation();
  if (context.mode !== 'internal') return null;
  const ids = providerFeatureIds(feature);
  const profiles = context.profiles.filter((profile) => profile.audience === 'company');
  return (
    <div className="distribution-history">
      <p>{t('제공된 빌드의 기록이며 현재 정책의 최신 승인을 뜻하지 않습니다.')}</p>
      <dl className="distribution-facts">
        <div>
          <dt>{t('소유 패키지')}</dt>
          <dd>
            <code>{feature.owner}</code>
          </dd>
        </div>
        <div>
          <dt>{t('현재 정책 승인')}</dt>
          <dd>{t('미확인')}</dd>
        </div>
      </dl>
      <Alert severity="info">
        {t('Manifest 포함은 해당 제공 빌드의 승인 기록입니다. 납품·설치·사용을 증명하지 않습니다.')}
      </Alert>
      {ids.length === 0 && (
        <p>
          {t(
            '정확한 공개 기능 ID를 확인하지 못했습니다. 상위 패키지나 타입의 포함 여부로 추정하지 않습니다.',
          )}
        </p>
      )}
      {profiles.length === 0 && <p>{t('확인할 빌드 기록이 없습니다.')}</p>}
      {profiles.map((profile) => (
        <section key={profile.id} className="distribution-history-profile">
          <h3>{profile.label}</h3>
          <HistoryRecords profile={profile} owner={feature.owner} />
          {profileTargets(profile).map((build, index) => (
            <section
              key={build.buildId ?? `unconfirmed-${index}`}
              className="distribution-history-profile"
            >
              <p>
                {t('제공 빌드')}: <code>{build.buildId ?? t('미확인')}</code>
              </p>
              {ids.length > 0 && (
                <OwpTable
                  containerProps={{
                    className: 'distribution-table-scroll',
                    role: 'region',
                    'aria-label': t('공개 기능별 Manifest 포함 여부'),
                    tabIndex: 0,
                  }}
                  className="distribution-table"
                  size="small"
                  aria-label={t('공개 기능별 Manifest 포함 여부')}
                  headers={{ feature: t('공개 기능 ID'), inclusion: t('해당 빌드 기록') }}
                  rows={ids.map((featureId) => ({
                    feature: <code>{featureId}</code>,
                    inclusion: t(inclusionLabels[historicalInclusion(build, featureId)]),
                  }))}
                />
              )}
              <ProfilePackages
                profile={{
                  ...build,
                  packages: build.packages.filter((pkg) => pkg.name === feature.owner),
                }}
              />
            </section>
          ))}
        </section>
      ))}
    </div>
  );
}

export function ProviderHistoryButton({ feature }: { readonly feature: ProviderFeature }) {
  const { t } = useOwpTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();
  const context = distributionContext();
  if (!isDistributionContext(context) || context.mode !== 'internal') return null;
  return (
    <>
      <Button
        size="small"
        variant="outlined"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t('{{name}} 제공업체 보기', {
          name: feature.member ? `${feature.name}.${feature.member}` : feature.name,
        })}
      >
        {t('제공업체')}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby={id}
      >
        <DialogTitle id={id}>
          {t('제공업체')}: {feature.member ? `${feature.name}.${feature.member}` : feature.name}
        </DialogTitle>
        <DialogContent dividers>
          <ProviderHistoryContent feature={feature} context={context} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('닫기')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

import { useOwpTranslation } from '@owp/components/hooks';
import { CodeSnippet } from '../features/code/CodeSnippet';
import { McpGettingStarted } from '../features/mcp/McpGettingStarted';
import { PlaygroundLink } from '../shared/ui/PlaygroundLink';
import { GettingStartedHeader } from '../shared/ui/GettingStartedHeader';
import { hasStandaloneGuide, packageGuideEntry } from './introductions';
import { getUtilityGuide } from './integrations/utility-guides';

export function PackageGettingStarted({
  playground,
}: {
  readonly playground: {
    readonly id: string;
    readonly name: string;
    readonly title: string;
    readonly version: string | null;
  };
}) {
  const { t, i18n } = useOwpTranslation();
  if (!hasStandaloneGuide(playground.id) || !playground.version)
    throw new RangeError(`Unknown package guide: ${playground.id}`);
  const example = packageGuideEntry(playground);
  const utilityGuide = getUtilityGuide(playground.id);
  return (
    <section className="workspace getting-started" aria-label={t('설치 및 사용 안내')}>
      <GettingStartedHeader example={example} packageId={playground.id} />
      <div className="guide-sections">
        <McpGettingStarted
          packageName={playground.name}
          version={playground.version}
          headingId={`${playground.id}-mcp`}
        />
        <section aria-labelledby={`${playground.id}-registry`}>
          <h2 id={`${playground.id}-registry`}>{t('레지스트리 설정')}</h2>
          <p>{t('프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정합니다.')}</p>
          <CodeSnippet label=".npmrc" code="@owp:registry=<OWP_REGISTRY_URL>" />
          <p className="guide-note">
            {t(
              '<OWP_REGISTRY_URL>에 OWP 패키지 레지스트리 주소를 입력합니다. 주소와 접근 권한은 Impix SmartBiz 팀에 문의해 주세요.',
            )}
          </p>
        </section>
        <section aria-labelledby={`${playground.id}-install`}>
          <h2 id={`${playground.id}-install`}>{t('패키지 설치')}</h2>
          <CodeSnippet
            label={t('터미널')}
            code={`pnpm add ${playground.name}@${playground.version}`}
          />
          <p>
            {t(
              '프로젝트에 필요한 peer dependency와 정적 리소스 설정은 설치 버전의 README와 공개 API를 확인하세요.',
            )}
          </p>
        </section>
        <section aria-labelledby={`${playground.id}-api`}>
          <h2 id={`${playground.id}-api`}>{t('공개 API 사용하기')}</h2>
          <p>
            {t(
              'API 목록에서 사용할 항목을 선택하면 공개 import 경로, 타입과 사용 코드를 확인할 수 있습니다.',
            )}
          </p>
          <PlaygroundLink
            href={`?${new URLSearchParams({ package: playground.id, sample: 'exports', lang: i18n.language })}`}
          >
            {t('{{packageName}} API 보기', { packageName: playground.name })}
          </PlaygroundLink>
        </section>
        {utilityGuide && (
          <section aria-labelledby={`${playground.id}-utilities`}>
            <h2 id={`${playground.id}-utilities`}>{t(utilityGuide.title)}</h2>
            {utilityGuide.sections.map((section) => (
              <section key={section.title}>
                <h3>{t(section.title)}</h3>
                <p>{t(section.body)}</p>
              </section>
            ))}
            <PlaygroundLink
              href={`?${new URLSearchParams({ package: playground.id, sample: utilityGuide.sample, lang: i18n.language })}`}
            >
              {t('실행 예제에서 확인하기')}
            </PlaygroundLink>
          </section>
        )}
      </div>
    </section>
  );
}

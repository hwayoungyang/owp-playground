import { useOwpTranslation } from '@owp/components/hooks';
import coreManifest from '@owp/core/package.json' with { type: 'json' };
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import { FrameworkIntroduction } from '../../../shared/ui/FrameworkIntroduction';
import { chartsPackage } from '../../registry';
import { type ChartCatalogEntry, chartCatalog, chartExecutionCatalog } from '../catalog';
import layoutSource from './chart-layout.css?raw';
import source from './getting-started.tsx?raw';
import '../styles.css';

export function ChartsGettingStarted({
  example,
}: {
  readonly example: Extract<ChartCatalogEntry, { readonly kind: 'guide' }>;
}) {
  const { t } = useOwpTranslation();
  const exampleCount = chartCatalog.filter((entry) => entry.kind === 'chart').length;
  return (
    <section className="workspace getting-started" aria-label={t('설치 및 사용 안내')}>
      <WorkspaceHeading example={example} packageTitle="OwpCharts" categoryLabel="문서" />
      <div className="guide-sections">
        <FrameworkIntroduction packageId="charts" />
        <section aria-labelledby="charts-registry">
          <h2 id="charts-registry">{t('레지스트리 설정')}</h2>
          <p>{t('프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정합니다.')}</p>
          <CodeSnippet label=".npmrc" code="@owp:registry=<OWP_REGISTRY_URL>" />
          <p className="guide-note">
            {t(
              '<OWP_REGISTRY_URL>에 OWP 패키지 레지스트리 주소를 입력합니다. 주소와 접근 권한은 Impix SmartBiz 팀에 문의해 주세요.',
            )}
          </p>
        </section>
        <section aria-labelledby="charts-install">
          <h2 id="charts-install">{t('패키지 설치')}</h2>
          <p>
            {t('Dependencies: React 19 · Material UI 9 · Emotion 11 · @owp/core {{version}}', {
              version: coreManifest.version,
            })}
          </p>
          <CodeSnippet
            label={t('터미널')}
            code={`pnpm add @owp/charts@${chartsPackage.version} @owp/core@^${coreManifest.version}`}
          />
          <p className="guide-note">
            {t(
              '@owp/charts {{version}}의 공개 API를 사용합니다. 별도 Chart.js 설치·등록 없이 실행할 수 있습니다.',
              {
                version: chartsPackage.version,
              },
            )}
          </p>
          <p className="guide-note">
            {t(
              '패키지에서 Chart.js를 자동으로 등록합니다. ChartFrame의 preset="owp"로 공통 스타일·HTML 툴팁·범례를 적용합니다. 전용 차트는 유형별 데이터·props로 구성할 수 있습니다.',
            )}
          </p>
        </section>
        <section aria-labelledby="charts-usage">
          <h2 id="charts-usage">Usage</h2>
          <p>
            {t(
              'OWP API의 문자열을 숫자로 변환해 ChartFrame에 전달합니다. 데이터 탭에서 같은 값을 OWP_DATA 필드로 확인할 수 있습니다.',
            )}
          </p>
          <CodeSnippet label="GettingStartedChart.tsx" code={source} language="typescript" />
          <p className="guide-note">
            {t(
              'ChartFrame 레이아웃에 utility class를 사용합니다. Tailwind가 없으면 아래 CSS를 적용해 주세요.',
            )}
          </p>
          <CodeSnippet label="chart-layout.css" code={layoutSource} language="css" />
          <p className="guide-note">
            {t(
              '기본 메뉴에 assets/icons의 SVG sprite를 사용합니다. 메뉴를 사용하려면 OWP Core 아이콘 리소스를 배포해야 합니다. 외부 버튼과 exportRef로도 내보낼 수 있습니다.',
            )}
          </p>
        </section>
        <section aria-labelledby="charts-features">
          <h2 id="charts-features">{t('예제 구성')}</h2>
          <p>
            {t('예제 메뉴 {{count}}개와 구성 {{configCount}}개, 시작 가이드를 제공합니다.', {
              count: exampleCount,
              configCount: chartExecutionCatalog.filter((entry) => entry.kind === 'chart').length,
            })}
          </p>
          <p>
            {t(
              '차트 종류별 기본 구성과 기능별 설정 예제를 제공합니다. 활용 예제에서 여러 기능을 조합한 구성을 확인할 수 있습니다.',
            )}
          </p>
          <p className="guide-note">
            {t(
              'Bar·Line·복합 차트는 ChartFrame으로 구성합니다. Area·Box plot·Treemap·Radar·원형·Heatmap·Live chart는 전용 Owp 컴포넌트를 사용합니다. Box plot·Treemap·Heatmap은 코드 탭에서 전용 컴포넌트와 직접 구성 방식을 비교할 수 있습니다. API 응답 변환·polling·예제 조작은 앱에서 처리합니다.',
            )}
          </p>
        </section>
      </div>
    </section>
  );
}

import { useOwpTranslation } from '@owp/components/hooks';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import { chartsPackage } from '../../registry';
import { type ChartCatalogEntry, chartCatalog } from '../catalog';
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
      <WorkspaceHeading example={example} packageTitle="OwpCharts" categoryLabel="기본 차트" />
      <div className="guide-sections">
        <section aria-labelledby="charts-registry">
          <h2 id="charts-registry">{t('레지스트리 설정')}</h2>
          <p>{t('프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정합니다.')}</p>
          <CodeSnippet label=".npmrc" code="@owp:registry=<OWP_REGISTRY_URL>" />
          <p className="guide-note">
            {t(
              '<OWP_REGISTRY_URL>은 OWP 패키지 레지스트리 URL입니다. 주소 및 접근 권한은 Impix SmartBiz 팀에 문의 바랍니다.',
            )}
          </p>
        </section>
        <section aria-labelledby="charts-install">
          <h2 id="charts-install">{t('패키지 설치')}</h2>
          <p>{t('Dependencies: React 19 · Material UI 9 · Emotion 11 · @owp/core 5 또는 6')}</p>
          <CodeSnippet
            label={t('터미널')}
            code={`pnpm add @owp/charts@${chartsPackage.version} @owp/core@^5.0.0`}
          />
          <p className="guide-note">
            {t(
              '이 예제는 @owp/charts {{version}}의 공개 API를 사용합니다. 별도 Chart.js 설치나 등록 없이 시작할 수 있습니다.',
              { version: chartsPackage.version },
            )}
          </p>
          <p className="guide-note">
            {t(
              'Chart.js 등록은 패키지 내부에서 처리합니다. ChartFrame preset="owp"는 공통 스타일·HTML 툴팁·범례를 제공하고, 전용 차트는 데이터와 유형별 props로 구성합니다.',
            )}
          </p>
        </section>
        <section aria-labelledby="charts-usage">
          <h2 id="charts-usage">Usage</h2>
          <p>
            {t(
              'OWP API의 문자열 값을 숫자로 변환한 뒤 ChartFrame에 전달합니다. 데이터 탭에는 같은 값을 OWP_DATA 필드로 표시합니다.',
            )}
          </p>
          <CodeSnippet label="GettingStartedChart.tsx" code={source} language="typescript" />
          <p className="guide-note">
            {t(
              'ChartFrame은 레이아웃 utility class를 사용합니다. Tailwind가 없는 프로젝트에서는 다음 CSS를 함께 적용합니다.',
            )}
          </p>
          <CodeSnippet label="chart-layout.css" code={layoutSource} language="css" />
          <p className="guide-note">
            {t(
              '기본 메뉴의 아이콘은 assets/icons의 SVG sprite를 사용합니다. OWP Core 프로젝트의 아이콘 리소스를 배포하거나, 외부 버튼에서 exportRef로 내보낼 수 있습니다.',
            )}
          </p>
        </section>
        <section aria-labelledby="charts-features">
          <h2 id="charts-features">{t('예제 구성')}</h2>
          <p>
            {t('실행 예제 {{count}}개와 시작 가이드를 제공합니다.', {
              count: exampleCount,
            })}
          </p>
          <p className="guide-note">
            {t(
              'Bar·Line·복합 차트는 ChartFrame을 사용합니다. Area·Box plot·Treemap·Radar·원형·Heatmap·Live chart는 전용 Owp component를 제공합니다. API 응답 변환·polling·샘플 조작은 앱에서 처리합니다.',
            )}
          </p>
        </section>
      </div>
    </section>
  );
}

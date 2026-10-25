import { useOwpTranslation } from '@owp/components/hooks';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import { type CoreCatalogEntry } from '../catalog';
import { corePackage } from '../../packages';
import source from './getting-started.tsx?raw';
import '../styles.css';

export function CoreGettingStarted({
  example,
}: {
  readonly example: Extract<CoreCatalogEntry, { readonly kind: 'guide' }>;
}) {
  const { t } = useOwpTranslation();
  return (
    <section className="workspace getting-started" aria-label={t('설치 및 사용 안내')}>
      <WorkspaceHeading example={example} packageTitle="owp/core" categoryLabel="문서" />
      <div className="guide-sections">
        <p className="guide-introduction">
          {t(
            '앱 초기화부터 API 요청, 인증·라우팅, 설정과 공통 UI까지 연결하는 React 기반 패키지입니다.',
          )}
        </p>
        <section aria-labelledby="core-responsibility">
          <h2 id="core-responsibility">{t('Core의 역할')}</h2>
          <p>
            {t(
              'OwpCoreProvider가 앱 환경·설정·상태·QueryClient를 구성합니다. OwpStyleProvider는 테마를 적용하고, OwpUiProvider는 인증·라우팅·페이지 이탈과 공통 피드백을 연결합니다.',
            )}
          </p>
          <p>
            {t(
              'API 요청은 createOwpApiHooks로 한 번 설정하고 useApiQuery·useApiMutation으로 사용합니다. 페이지·검색·다이얼로그는 같은 앱 설정과 상태를 공유합니다.',
            )}
          </p>
          <p>
            {t(
              'Provider와 앱 초기화는 시작하기에서 확인하고, 실행 예제는 API·데이터 연결, 앱 상태·설정, 전역 상태·복구, UI Adapter 순서로 읽습니다.',
            )}
          </p>
          <p>
            {t(
              'Core가 소유하는 provider·API·hook·store·타입은 @owp/core/contexts·hooks·store·types 등 실제 공개 경로를 사용하고, 전용 컴포넌트(OwpQuerySelector·공통코드 선택·OwpLanguageSwitcherSelect·OwpExportDataToExcelButton·OwpRouteErrorElement)는 @owp/core root에서 제공합니다. OwpDialog·OwpPageCarded·OwpPageContent·OwpErrorBoundary와 보조 UI는 @owp/components에서 가져옵니다. 앱 설정 예제의 OwpTable·OwpFieldTable과 검색 예제의 OwpSearchFilter는 설정·검색 진행 정책을 연결하는 @owp/core adapter를 사용합니다.',
            )}
          </p>
          <p>
            {t(
              'DialogProps<TPayload, TResult>는 dialog manager 계약으로 @owp/core/types에서 가져옵니다. Components UI의 OwpDialogProps는 @owp/components/types를 사용하고, isDirty·discardGuard 같은 Core 정책 옵션은 useDialogPolicy에 전달합니다.',
            )}
          </p>
          <p>
            {t(
              'useDialogPolicy·usePageCardedPolicy는 @owp/core/hooks에서 가져와 policy.styles를 함께 render하고 UI props 뒤에 policy.props를 펼칩니다. OwpPageContent의 responsiveLayoutGlobalStyles slot에는 @owp/core의 OwpCoreResponsiveLayoutGlobalStyles를 연결하고, OwpErrorBoundary에는 @owp/core/utils의 errorBoundaryPolicy를 펼칩니다. 같은 Core adapter에 정책을 중복 연결하지 않습니다.',
            )}
          </p>
        </section>
        <section aria-labelledby="core-registry">
          <h2 id="core-registry">{t('레지스트리 설정')}</h2>
          <p>{t('프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정합니다.')}</p>
          <CodeSnippet label=".npmrc" code="@owp:registry=<OWP_REGISTRY_URL>" />
        </section>
        <section aria-labelledby="core-install">
          <h2 id="core-install">{t('패키지 설치')}</h2>
          <p>{t('Dependencies: React 19 · Material UI 9 · Emotion 11 · i18next')}</p>
          <CodeSnippet
            label={t('터미널')}
            code={`pnpm add @owp/core@${corePackage.version} @owp/excel@^2.0.0`}
          />
          <p className="guide-note">
            {t(
              'react-router-dom, react-hook-form, notistack 등 peer dependency는 설치한 패키지의 package.json을 확인하세요.',
            )}
          </p>
        </section>
        <section aria-labelledby="core-setup">
          <h2 id="core-setup">{t('앱 초기화')}</h2>
          <p>
            {t(
              '한금 소비앱의 AppProviders 구성을 줄인 예제입니다. 앱의 i18next를 먼저 초기화하고 routes·navigation·settings를 전달합니다.',
            )}
          </p>
          <CodeSnippet label="AppProviders.tsx" code={source} language="typescript" />
          <p className="guide-note">
            {t(
              'OwpUiProvider는 React Router Data Router 안에 배치하고, usePageCardedPolicy는 그 하위 페이지에서 호출합니다. Playground의 독립 예제는 서버 인증 없이 실행합니다.',
            )}
          </p>
        </section>
        <section aria-labelledby="core-styles">
          <h2 id="core-styles">{t('스타일과 정적 리소스')}</h2>
          <CodeSnippet
            label="main.tsx"
            code={"import '@owp/core/owp-app.css';"}
            language="typescript"
          />
          <p className="guide-note">
            {t(
              'Core CSS는 html 10px을 기준으로 합니다. MUI theme의 typography.htmlFontSize도 10으로 맞춥니다.',
            )}
          </p>
          <CodeSnippet
            label="vite.config.ts"
            code={"import { owpCoreAssetsPlugin } from '@owp/core/vite/owpCoreAssetsPlugin';"}
            language="typescript"
          />
          <p className="guide-note">
            {t(
              'Vite의 plugins에 owpCoreAssetsPlugin()을 추가하면 아이콘·폰트를 복사할 수 있습니다.',
            )}
          </p>
        </section>
      </div>
    </section>
  );
}

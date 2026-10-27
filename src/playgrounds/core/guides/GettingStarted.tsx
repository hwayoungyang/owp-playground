import { useOwpTranslation } from '@owp/components/hooks';
import { useEffect } from 'react';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { McpGettingStarted } from '../../../features/mcp/McpGettingStarted';
import { type CoreCatalogEntry } from '../catalog';
import { corePackage } from '../../packages';
import { CoreFoundationGuide } from './FoundationGuide';
import { CoreGuideLayout } from './CoreGuideLayout';
import { CoreFeaturesGuide } from './core-features';
import {
  coreOwnershipIntroduction,
  coreOwnershipNotes,
  coreOwnershipUsageNote,
} from './package-ownership';
import source from './getting-started.tsx?raw';
import '../styles.css';

const sections = [
  { id: 'core-responsibility', title: 'Core의 역할' },
  { id: 'core-mcp', title: 'MCP 서버 연결' },
  { id: 'core-registry', title: '레지스트리 설정' },
  { id: 'core-install', title: '패키지 설치' },
  { id: 'core-setup', title: '앱 초기화' },
  { id: 'core-styles', title: '스타일과 정적 리소스' },
  { id: 'core-ownership', title: '패키지별 역할과 연결' },
] as const;

export function CoreGettingStarted({
  example,
}: {
  readonly example: Extract<CoreCatalogEntry, { readonly kind: 'guide' }>;
}) {
  const { t } = useOwpTranslation();
  useEffect(() => {
    if (example.id !== 'getting-started' || !window.location.hash.startsWith('#core-')) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [example.id]);
  if (example.id === 'core-features') return <CoreFeaturesGuide example={example} />;
  if (example.id !== 'getting-started') return <CoreFoundationGuide example={example} />;
  return (
    <CoreGuideLayout
      example={example}
      sections={sections}
      introduction="앱 초기화부터 API 요청, 인증·라우팅, 설정과 공통 UI까지 연결하는 React 기반 패키지입니다."
    >
      <section aria-labelledby="core-responsibility">
        <h2 id="core-responsibility">{t('Core의 역할')}</h2>
        <p>
          {t(
            'Core는 프로바이더·상태 관리·API·테마를 연결하는 앱의 기반입니다. 프로바이더는 공유 실행 환경을 만들고, 상태 hook은 사용자·메뉴·설정을, API hook은 요청과 캐시를, 테마 설정은 앱의 공통 스타일을 관리합니다.',
          )}
        </p>
        <p>
          {t(
            '문서 메뉴의 프로바이더 구성 → 상태 관리 → API 설정 → 테마와 설정 순서로 각 기능의 역할·설정 방법·기대효과를 확인하세요. 아래에서는 설치와 전체 진입 코드를 확인할 수 있습니다.',
          )}
        </p>
        <p>
          {t(
            '참조 프로젝트의 AppProviders·App·api/index.ts·configs/theme/settings.ts 구성을 기준으로 업무별 값은 줄이고 공통 연결 방법을 설명합니다. 실행 예제에서는 API 응답·권한·설정·페이지 정책의 실제 변화를 확인합니다.',
          )}
        </p>
        <p>
          {t(
            '공통 UI는 Components가 제공하고, Core는 그 UI에 앱 설정·인증·페이지 이탈·요청 취소 같은 정책을 연결합니다. 같은 패키지별 역할에는 이미 적용된 정책을 중복 연결하지 않습니다.',
          )}
        </p>
      </section>
      <McpGettingStarted
        packageName={corePackage.name}
        version={corePackage.version}
        headingId="core-mcp"
      />
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
          code={`pnpm add @owp/core@${corePackage.version} @owp/excel@^3.0.0`}
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
            '참조 프로젝트의 AppProviders 구성을 줄인 예제입니다. 앱의 i18next를 먼저 초기화하고 routes·navigation·settings를 전달합니다.',
          )}
        </p>
        <CodeSnippet label="AppProviders.tsx" code={source} language="typescript" />
        <p className="guide-note">
          {t(
            'OwpUiProvider는 React Router Data Router 안에 배치하고, 페이지 이동 보호가 필요한 화면에서 usePageLeaveGuard를 호출합니다. Playground의 독립 예제는 서버 인증 없이 실행합니다.',
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
          {t('Vite의 plugins에 owpCoreAssetsPlugin()을 추가하면 아이콘·폰트를 복사할 수 있습니다.')}
        </p>
      </section>
      <section aria-labelledby="core-ownership">
        <h2 id="core-ownership">{t('패키지별 역할과 연결')}</h2>
        <p>{t(coreOwnershipIntroduction)}</p>
        <dl className="core-guide-ownership">
          {Object.entries(coreOwnershipNotes).map(([id, note]) => (
            <div key={id} id={`core-ownership-${id}`}>
              <dt>{note.name}</dt>
              <dd>{t(note.body)}</dd>
            </div>
          ))}
        </dl>
        <p className="guide-note">{t(coreOwnershipUsageNote)}</p>
      </section>
    </CoreGuideLayout>
  );
}

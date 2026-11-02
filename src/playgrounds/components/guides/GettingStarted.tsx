import { useOwpTranslation } from '@owp/components/hooks';
import componentsManifest from '@owp/components/package.json' with { type: 'json' };
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { ApiLinks } from '../../../features/api/ApiLinks';
import { PlaygroundLink } from '../../../shared/ui/PlaygroundLink';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import type { ComponentsGuide } from '../model/types';
import source from './getting-started.tsx?raw';

const peers = componentsManifest.peerDependencies;
const installCommand = `pnpm add @owp/components@${componentsManifest.version} react@${peers.react} react-dom@${peers['react-dom']} @mui/material@${peers['@mui/material']} @mui/system@${peers['@mui/system']} @emotion/react@${peers['@emotion/react']} @emotion/styled@${peers['@emotion/styled']}`;
const publicImports = `import { OwpNumberField, OwpTable } from '@owp/components';
import { useConfirm, useResponsiveDevice } from '@owp/components/hooks';
import { splitSelectorValue, mergeSx } from '@owp/components/utils';`;
const exampleLinks = [
  { id: 'number-field', title: 'OwpNumberField' },
  { id: 'hook-use-responsive-device', title: 'useResponsiveDevice' },
  { id: 'util-split-selector-value', title: 'splitSelectorValue' },
] as const;

export function ComponentsGettingStarted({ example }: { readonly example: ComponentsGuide }) {
  const { t, i18n } = useOwpTranslation();
  return (
    <section className="workspace getting-started" aria-label={t('설치 및 사용 안내')}>
      <WorkspaceHeading example={example} packageTitle="owp/components" categoryLabel="문서" />
      <div className="guide-sections">
        <section aria-labelledby="components-purpose">
          <h2 id="components-purpose">{t('Components의 역할')}</h2>
          <p>
            {t(
              '@owp/components는 Material UI 기반의 입력·선택·표·레이아웃·피드백 컴포넌트와 관련 Hooks·Utils를 제공합니다. 필요한 공개 API를 가져와 React 화면에 조합합니다.',
            )}
          </p>
        </section>
        <section aria-labelledby="components-registry">
          <h2 id="components-registry">{t('레지스트리 설정')}</h2>
          <p>{t('프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정합니다.')}</p>
          <CodeSnippet label=".npmrc" code="@owp:registry=<OWP_REGISTRY_URL>" />
          <p className="guide-note">
            {t(
              '<OWP_REGISTRY_URL>에 OWP 패키지 레지스트리 주소를 입력합니다. 주소와 접근 권한은 Impix SmartBiz 팀에 문의해 주세요.',
            )}
          </p>
        </section>
        <section aria-labelledby="components-install">
          <h2 id="components-install">{t('패키지 설치')}</h2>
          <p>
            {t(
              '필수 peer dependency는 React·React DOM 19, Material UI·MUI System 9, Emotion React·Styled 11입니다. 아래 명령은 Components {{version}}의 지원 범위를 사용합니다.',
              { version: componentsManifest.version },
            )}
          </p>
          <CodeSnippet label={t('터미널')} code={installCommand} />
        </section>
        <section aria-labelledby="components-usage">
          <h2 id="components-usage">{t('기본 사용법')}</h2>
          <p>
            {t(
              'MUI ThemeProvider에 테마를 연결하고 OwpNumberField의 값을 문자열 state로 관리합니다. onValueChange에서 info.source가 event일 때 next.value를 저장하며, helperText로 입력 형식을 안내합니다.',
            )}
          </p>
          <CodeSnippet label="GettingStartedComponents.tsx" code={source} language="typescript" />
          <p className="guide-note">
            {t(
              '예제에는 MUI ThemeProvider와 CssBaseline이 포함되어 있습니다. 프로젝트에 같은 설정이 있다면 기존 Provider 아래에 OwpNumberField를 배치합니다.',
            )}
          </p>
        </section>
        <section aria-labelledby="components-imports">
          <h2 id="components-imports">{t('컴포넌트·Hooks·Utils 사용법')}</h2>
          <p>
            {t(
              '컴포넌트는 @owp/components, hook은 @owp/components/hooks, 유틸은 @owp/components/utils에서 가져옵니다. 각 예제에서 실제 옵션과 연결 방법을 확인할 수 있습니다.',
            )}
          </p>
          <CodeSnippet label="Import" code={publicImports} language="typescript" />
          <ul>
            {exampleLinks.map((link) => (
              <li key={link.id}>
                <PlaygroundLink
                  href={`?${new URLSearchParams({ package: 'components', sample: link.id, lang: i18n.language })}`}
                >
                  {link.title}
                </PlaygroundLink>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ApiLinks example={example} />
    </section>
  );
}

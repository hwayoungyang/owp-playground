import { useOwpTranslation } from '@owp/components/hooks';
import excelManifest from '@owp/excel/package.json' with { type: 'json' };
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { McpGettingStarted } from '../../../features/mcp/McpGettingStarted';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import { FrameworkIntroduction } from '../../../shared/ui/FrameworkIntroduction';
import { dataGridPackage } from '../../registry';
import type { GridCatalogEntry } from '../catalog';
import source from './getting-started.tsx?raw';

const registry = '@owp:registry=<OWP_REGISTRY_URL>';
const install = `pnpm add @owp/datagrid@${dataGridPackage.version} @owp/excel@^${excelManifest.version}`;

export function GridGettingStarted({
  example,
}: {
  readonly example: Extract<GridCatalogEntry, { readonly kind: 'guide' }>;
}) {
  const { t } = useOwpTranslation();
  return (
    <section className="workspace getting-started" aria-label={t('설치 및 사용 안내')}>
      <WorkspaceHeading example={example} packageTitle="OwpDataGrid" categoryLabel="문서" />
      <div className="guide-sections">
        <FrameworkIntroduction packageId="datagrid" />
        <McpGettingStarted packageName={dataGridPackage.name} version={dataGridPackage.version} />
        <section aria-labelledby="registry-heading">
          <h2 id="registry-heading">{t('레지스트리 설정')}</h2>
          <p>{t('프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정합니다.')}</p>
          <CodeSnippet label=".npmrc" code={registry} />
          <p className="guide-note">
            {t(
              '<OWP_REGISTRY_URL>에 OWP 패키지 레지스트리 주소를 입력합니다. 주소와 접근 권한은 Impix SmartBiz 팀에 문의해 주세요.',
            )}
          </p>
        </section>
        <section aria-labelledby="install-heading">
          <h2 id="install-heading">{t('패키지 설치')}</h2>
          <p>{t('Dependencies: React 19 · Material UI 9')}</p>
          <CodeSnippet label={t('터미널')} code={install} />
        </section>
        <section aria-labelledby="usage-heading">
          <h2 id="usage-heading">Usage</h2>
          <p>
            {t(
              'field·getRowId로 API 필드와 행 ID를 연결합니다. 문자열의 숫자·boolean 변환과 트리 행 연결은 model/apiData.ts를 참고해 주세요.',
            )}
          </p>
          <CodeSnippet label="GettingStartedGrid.tsx" code={source} language="typescript" />
          <p>{t('Hook과 Ref는 같은 Grid API를 제공하며 연결 방식만 다릅니다.')}</p>
          <p>
            {t(
              'useDataGridApi() 객체를 Grid의 api에 연결합니다. 이벤트·Effect에서 최신 Grid 값을 조회할 수 있습니다. 객체·메서드 reference를 유지합니다. React 상태 자동 구독은 지원하지 않습니다.',
            )}
          </p>
          <p className="guide-note">
            {t(
              'API 객체당 Grid 하나에만 연결할 수 있습니다. 연결 전·해제 후에 호출하면 ReferenceError가 발생합니다. Grid가 마운트된 동안에만 호출해 주세요. 기존 ref와 함께 연결할 수 있습니다.',
            )}
          </p>
        </section>
      </div>
    </section>
  );
}

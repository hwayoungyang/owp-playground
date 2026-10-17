import excelManifest from '@owp/excel/package.json' with { type: 'json' };
import { useTranslation } from 'react-i18next';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import { dataGridPackage } from '../../registry';
import { categories, type GridCatalogEntry } from '../catalog';
import source from './getting-started.tsx?raw';

const registry = '@owp:registry=<OWP_REGISTRY_URL>';
const install = `pnpm add @owp/datagrid@${dataGridPackage.version} @owp/excel@^${excelManifest.version}`;

export function GridGettingStarted({
  example,
}: {
  readonly example: Extract<GridCatalogEntry, { readonly kind: 'guide' }>;
}) {
  const { t } = useTranslation('app');
  return (
    <section className="workspace getting-started" aria-label={t('설치 및 사용 안내')}>
      <WorkspaceHeading
        example={example}
        packageTitle="OwpDataGrid"
        categoryLabel={categories.find((entry) => entry.id === example.category)?.label ?? ''}
      />
      <div className="guide-sections">
        <section aria-labelledby="registry-heading">
          <h2 id="registry-heading">{t('레지스트리 설정')}</h2>
          <p>{t('프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정합니다.')}</p>
          <CodeSnippet label=".npmrc" code={registry} />
          <p className="guide-note">
            {t(
              '<OWP_REGISTRY_URL>은 OWP 패키지 레지스트리 URL입니다. 주소 및 접근 권한은 Impix SmartBiz 팀에 문의 바랍니다.',
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
              'OWP API 필드명을 field와 getRowId에 연결합니다. 숫자·boolean 변환과 트리 연결 예제는 model/apiData.ts에서 확인할 수 있습니다.',
            )}
          </p>
          <CodeSnippet label="GettingStartedGrid.tsx" code={source} language="typescript" />
        </section>
      </div>
    </section>
  );
}

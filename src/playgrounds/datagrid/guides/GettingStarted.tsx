import { useTranslation } from 'react-i18next';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { SampleHeading } from '../../../shared/ui/SampleHeading';
import { categories, type Sample } from '../catalog';
import source from './getting-started.tsx?raw';

const registry = '@owp:registry=<OWP_REGISTRY_URL>';
const install = 'pnpm add @owp/datagrid@latest @owp/excel@^1.1.0';

export function GettingStarted({
  sample,
}: {
  readonly sample: Extract<Sample, { readonly kind: 'guide' }>;
}) {
  const { t } = useTranslation('app');
  return (
    <section className="workspace getting-started" aria-label={t('설치 및 사용 안내')}>
      <SampleHeading
        sample={sample}
        packageTitle="OwpDataGrid"
        categoryLabel={categories.find((entry) => entry.id === sample.category)?.label ?? ''}
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
          <p>{t('컬럼과 데이터를 정의하고 getRowId로 행을 구분합니다.')}</p>
          <CodeSnippet label="GettingStarted.tsx" code={source} language="typescript" />
        </section>
      </div>
    </section>
  );
}

import { useOwpTranslation } from '@owp/components/hooks';
import excelManifest from '@owp/excel/package.json' with { type: 'json' };
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { McpGettingStarted } from '../../../features/mcp/McpGettingStarted';
import { GettingStartedHeader } from '../../../shared/ui/GettingStartedHeader';
import { dataGridPackage } from '../../registry';
import type { GridCatalogEntry } from '../catalog';
import { GettingStartedGrid } from './getting-started';
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
      <GettingStartedHeader example={example} packageId="datagrid" />
      <div className="guide-sections">
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
              '전체 목록을 조회만 할 때는 OwpDataGridReadOnlyProps로 getRowId를 생략할 수 있습니다. 원본 ID와 작업명이 모두 같은 두 행도 각각 표시하고 선택할 수 있습니다.',
            )}
          </p>
          <p>
            {t(
              '자동 행 ID 표에서 행을 선택하고 작업 헤더로 정렬하거나 필터를 적용했다가 해제해 보세요. 같은 rows 배열을 쓰므로 선택은 유지됩니다. 같은 데이터로 재조회하면 새 배열을 받아 자동 ID의 선택이 해제됩니다.',
            )}
          </p>
          <p>
            {t(
              "getRowId를 지정하면 기본 strict는 중복 ID 오류를 표 안에 표시합니다. preserve는 중복 행도 모두 표시합니다. preserve 표에서 원본 ID 1과 2의 행을 선택하고 재조회하면 고유 ID 1의 선택은 유지되고 중복 ID 2에 속한 행의 선택은 해제됩니다.",
            )}
          </p>
          <GettingStartedGrid />
          <CodeSnippet label="GettingStartedGrid.tsx" code={source} language="typescript" />
          <p>
            {t(
              '기존 OwpDataGridProps는 getRowId를 필수로 유지합니다. 행 이동·서버 조회와 저장·편집·트리·상세 패널처럼 재조회 뒤에도 같은 행을 식별해야 하는 기능에는 안정적인 고유 ID를 지정해 주세요.',
            )}
          </p>
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

import { useOwpTranslation } from '@owp/components/hooks';
import { lazy, Suspense } from 'react';
import { Tab, Tabs } from '@mui/material';
import type { ExampleMetadata } from '../../shared/types/playground';
import { updateWorkspaceTabUrl, workspaceApiTabs } from '../../shared/ui/WorkspaceTabs';
import { ContractContent, contractTabs } from './ContractContent';
import type { ContractTab } from './ContractContent';
import { loadPublicApi } from './loader';
import { isPublicApiPackage, publicApiPackageIds } from './types';
import type { PublicApiPackageData } from './types';
import '../../playgrounds/components/api/styles.css';
import './styles.css';

type Props = { readonly example: ExampleMetadata; readonly tab: ContractTab };

function Panels({ data, example, tab }: Props & { readonly data: PublicApiPackageData }) {
  const entries = data.entries.filter(
    (entry) =>
      (example.api.includes(entry.name) ||
        example.api.includes(entry.id) ||
        entry.exampleIds?.includes(example.id)) &&
      contractTabs([entry]).includes(tab),
  );
  return (
    <>
      {entries.map((entry) => (
        <section key={entry.id}>
          <h2>{entry.name}</h2>
          <ContractContent entry={entry} tab={tab} />
        </section>
      ))}
    </>
  );
}

const packages = Object.fromEntries(
  publicApiPackageIds.map((id) => [
    id,
    lazy(async () => {
      const data = await loadPublicApi(id);
      return { default: (props: Props) => <Panels data={data} {...props} /> };
    }),
  ]),
);

export function WorkspaceApiPanels({
  example,
  tab,
  prefix,
  onTabChange,
}: {
  readonly example: ExampleMetadata;
  readonly tab: string;
  readonly prefix: string;
  readonly onTabChange: (tab: ContractTab) => void;
}) {
  const { t } = useOwpTranslation();
  if (tab !== 'props' && tab !== 'params' && tab !== 'returns' && tab !== 'type') return null;
  const id = example.package.replace('@owp/', '');
  if (!isPublicApiPackage(id)) return null;
  const Package = packages[id];
  if (!Package) return null;
  const contracts = workspaceApiTabs(example);
  return (
    <div role="tabpanel" id={`${prefix}-panel-api`} aria-labelledby={`${prefix}-tab-api`}>
      <div className="workspace-api-navigation">
        <Tabs
          value={tab}
          variant="scrollable"
          scrollButtons="auto"
          aria-label={t('API 상세 보기')}
          onChange={(_, value: unknown) => {
            const next = contracts.find((candidate) => candidate === value);
            if (next) {
              onTabChange(next);
              updateWorkspaceTabUrl(next);
            }
          }}
        >
          {contracts.map((contract) => (
            <Tab
              key={contract}
              value={contract}
              id={`${prefix}-tab-${contract}`}
              aria-controls={`${prefix}-panel-${contract}`}
              label={
                { props: 'Props', params: 'Params', returns: 'Returns', type: 'Type' }[contract]
              }
            />
          ))}
        </Tabs>
      </div>
      <div
        className="components-api public-api-panel"
        role="tabpanel"
        id={`${prefix}-panel-${tab}`}
        aria-labelledby={`${prefix}-tab-${tab}`}
      >
        <Suspense fallback={<p role="status">{t('공개 API를 불러오는 중…')}</p>}>
          <Package example={example} tab={tab} />
        </Suspense>
      </div>
    </div>
  );
}

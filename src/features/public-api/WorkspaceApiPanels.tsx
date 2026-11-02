import { useOwpTranslation } from '@owp/components/hooks';
import { Suspense, use } from 'react';
import publicApiIndex from 'virtual:public-api/index';
import { Tab, Tabs } from '@mui/material';
import type { ExampleMetadata } from '../../shared/types/playground';
import { updateWorkspaceTabUrl, workspaceApiTabs } from '../../shared/ui/WorkspaceTabs';
import { ContractContent, contractTabs } from './ContractContent';
import type { ContractTab } from './ContractContent';
import { loadPublicApiEntry } from './loader';
import { isPublicApiPackage } from './types';
import type { PublicApiEntry, PublicApiPackageId } from './types';
import { WorkspaceLoading } from '../../shared/ui/WorkspaceLoading';
import '../../playgrounds/components/api/styles.css';
import './styles.css';

type Props = { readonly example: ExampleMetadata; readonly tab: ContractTab };

function Panels({ id, example, tab }: Props & { readonly id: PublicApiPackageId }) {
  const entries = use(exampleEntries(id, example));
  return (
    <>
      {entries
        .filter((entry) => contractTabs([entry]).includes(tab))
        .map((entry) => (
          <section key={entry.id}>
            <h2>{entry.name}</h2>
            <ContractContent entry={entry} tab={tab} />
          </section>
        ))}
    </>
  );
}

const panels = new Map<string, Promise<readonly PublicApiEntry[]>>();

function exampleEntries(id: PublicApiPackageId, example: ExampleMetadata) {
  const key = `${id}/${example.id}`;
  const existing = panels.get(key);
  if (existing) return existing;
  const summaries = publicApiIndex.find((entry) => entry.id === id)?.entries ?? [];
  const selected = summaries.filter(
    (entry) =>
      example.api.includes(entry.name) ||
      example.api.includes(entry.id) ||
      entry.exampleIds?.includes(example.id),
  );
  const request = Promise.all(selected.map((entry) => loadPublicApiEntry(id, entry.id))).then(
    (loaded) => loaded.filter((entry): entry is PublicApiEntry => entry !== undefined),
  );
  panels.set(key, request);
  return request;
}

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
        <Suspense fallback={<WorkspaceLoading label="공개 API를 불러오는 중…" />}>
          <Panels id={id} example={example} tab={tab} />
        </Suspense>
      </div>
    </div>
  );
}

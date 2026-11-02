import { useOwpTranslation } from '@owp/components/hooks';
import { Tab, Tabs } from '@mui/material';
import { BracketsCurlyIcon, CodeIcon, DatabaseIcon, PlayIcon } from '@phosphor-icons/react';
import { z } from 'zod';
import publicApiIndex from 'virtual:public-api/index';
import { contractTabs } from '../../features/public-api/ContractContent';
import type { ExampleMetadata } from '../types/playground';

const tabDefinitions = [
  { value: 'preview', label: '예제', icon: <PlayIcon size={15} aria-hidden /> },
  { value: 'code', label: '코드', icon: <CodeIcon size={16} aria-hidden /> },
  { value: 'data', label: '데이터', icon: <DatabaseIcon size={15} aria-hidden /> },
  { value: 'events', label: '이벤트', icon: <BracketsCurlyIcon size={15} aria-hidden /> },
  { value: 'props', label: 'Props', icon: <BracketsCurlyIcon size={15} aria-hidden /> },
  { value: 'params', label: 'Params', icon: <BracketsCurlyIcon size={15} aria-hidden /> },
  { value: 'returns', label: 'Returns', icon: <BracketsCurlyIcon size={15} aria-hidden /> },
  { value: 'type', label: 'Type', icon: <BracketsCurlyIcon size={15} aria-hidden /> },
] as const;
const tabSchema = z.enum(tabDefinitions.map(({ value }) => value));
export type WorkspaceTab = z.infer<typeof tabSchema>;

export function updateWorkspaceTabUrl(value: WorkspaceTab): void {
  const url = new URL(location.href);
  if (value === 'preview' || value === 'data' || value === 'events') url.searchParams.delete('tab');
  else url.searchParams.set('tab', value);
  history.replaceState(null, '', url);
}

export function resolveWorkspaceTab(api: ExampleMetadata, requested: WorkspaceTab): WorkspaceTab {
  const entries =
    publicApiIndex
      .find((entry) => `@owp/${entry.id}` === api.package)
      ?.entries.filter(
        (entry) =>
          api.api.includes(entry.name) ||
          api.api.includes(entry.id) ||
          entry.exampleIds?.includes(api.id),
      ) ?? [];
  return requested === 'props' ||
    requested === 'params' ||
    requested === 'returns' ||
    requested === 'type'
    ? contractTabs(entries).some((tab) => tab === requested)
      ? requested
      : 'preview'
    : requested;
}

export function WorkspaceTabs({
  idPrefix,
  value,
  onChange,
  eventCount = 0,
  api,
}: {
  readonly idPrefix: string;
  readonly value: WorkspaceTab;
  readonly onChange: (value: WorkspaceTab) => void;
  readonly eventCount?: number;
  readonly api?: ExampleMetadata;
}) {
  const { t } = useOwpTranslation();
  const entries = api
    ? (publicApiIndex
        .find((entry) => `@owp/${entry.id}` === api.package)
        ?.entries.filter(
          (entry) =>
            api.api.includes(entry.name) ||
            api.api.includes(entry.id) ||
            entry.exampleIds?.includes(api.id),
        ) ?? [])
    : [];
  const contracts: readonly string[] = contractTabs(entries);
  const firstContract = tabDefinitions.find(({ value: tab }) => contracts.includes(tab))?.value;
  return (
    <div className="workspace-navigation">
      <Tabs
        value={value}
        variant="scrollable"
        scrollButtons="auto"
        onChange={(_, next: unknown) => {
          const result = tabSchema.safeParse(next);
          if (result.success) {
            onChange(result.data);
            updateWorkspaceTabUrl(result.data);
          }
        }}
        aria-label={t('예제 보기 방식')}
      >
        {tabDefinitions
          .filter(
            ({ value: tab }) =>
              ['preview', 'code', 'data', 'events'].includes(tab) || contracts.includes(tab),
          )
          .map(({ value: tab, label, icon }) => (
            <Tab
              key={tab}
              value={tab}
              id={`${idPrefix}-tab-${tab}`}
              aria-controls={`${idPrefix}-panel-${tab}`}
              className={
                tab === 'data' || tab === firstContract ? 'workspace-tab-group-start' : undefined
              }
              aria-label={
                tab === 'events' && eventCount > 0
                  ? t('이벤트 {{count}}', { count: eventCount })
                  : t(label)
              }
              label={
                <span className="workspace-tab-copy">
                  <span className="workspace-tab-group-label" aria-hidden="true">
                    {tab === 'preview'
                      ? t('작업')
                      : tab === 'data'
                        ? t('실행 결과')
                        : tab === firstContract
                          ? t('API 참조')
                          : '\u00a0'}
                  </span>
                  <span>
                    {tab === 'events' && eventCount > 0
                      ? t('이벤트 {{count}}', { count: eventCount })
                      : t(label)}
                  </span>
                </span>
              }
              icon={icon}
              iconPosition="start"
            />
          ))}
      </Tabs>
    </div>
  );
}

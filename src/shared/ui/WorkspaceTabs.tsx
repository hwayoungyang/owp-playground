import { useOwpTranslation } from '@owp/components/hooks';
import { Tab, Tabs } from '@mui/material';
import { BookOpenIcon, CodeIcon, DatabaseIcon, PlayIcon, PulseIcon } from '@phosphor-icons/react';
import { z } from 'zod';
import publicApiIndex from 'virtual:public-api/index';
import { contractTabs } from '../../features/public-api/ContractContent';
import type { ExampleMetadata } from '../types/playground';

const tabDefinitions = [
  { value: 'preview', label: '예제', icon: <PlayIcon size={16} aria-hidden /> },
  { value: 'code', label: '코드', icon: <CodeIcon size={16} aria-hidden /> },
  { value: 'data', label: '데이터', icon: <DatabaseIcon size={16} aria-hidden /> },
  { value: 'events', label: '이벤트', icon: <PulseIcon size={16} aria-hidden /> },
] as const;
const tabSchema = z.enum([
  ...tabDefinitions.map(({ value }) => value),
  'props',
  'params',
  'returns',
  'type',
]);
export type WorkspaceTab = z.infer<typeof tabSchema>;

export function updateWorkspaceTabUrl(value: WorkspaceTab): void {
  const url = new URL(location.href);
  if (value === 'preview' || value === 'data' || value === 'events') url.searchParams.delete('tab');
  else url.searchParams.set('tab', value);
  history.replaceState(null, '', url);
}

export function workspaceApiTabs(api?: ExampleMetadata) {
  if (!api) return [];
  const entries =
    publicApiIndex
      .find((entry) => `@owp/${entry.id}` === api.package)
      ?.entries.filter(
        (entry) =>
          api.api.includes(entry.name) ||
          api.api.includes(entry.id) ||
          entry.exampleIds?.includes(api.id),
      ) ?? [];
  return contractTabs(entries);
}

export function isWorkspaceApiTab(value: string) {
  return value === 'props' || value === 'params' || value === 'returns' || value === 'type';
}

export function resolveWorkspaceTab(api: ExampleMetadata, requested: WorkspaceTab): WorkspaceTab {
  return isWorkspaceApiTab(requested)
    ? workspaceApiTabs(api).some((tab) => tab === requested)
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
  const contracts = workspaceApiTabs(api);
  const firstContract = contracts[0];
  return (
    <div className="workspace-navigation workspace-navigation--example">
      <Tabs
        value={isWorkspaceApiTab(value) ? 'api' : value}
        variant="scrollable"
        scrollButtons="auto"
        onChange={(_, next: unknown) => {
          if (next === 'api' && firstContract) {
            onChange(firstContract);
            updateWorkspaceTabUrl(firstContract);
            return;
          }
          const result = tabSchema.safeParse(next);
          if (result.success) {
            onChange(result.data);
            updateWorkspaceTabUrl(result.data);
          }
        }}
        aria-label={t('예제 보기 방식')}
      >
        {tabDefinitions.map(({ value: tab, label, icon }) => (
          <Tab
            key={tab}
            value={tab}
            id={`${idPrefix}-tab-${tab}`}
            aria-controls={`${idPrefix}-panel-${tab}`}
            aria-label={
              tab === 'events' && eventCount > 0
                ? t('이벤트 {{count}}', { count: eventCount })
                : t(label)
            }
            label={
              <span className="workspace-tab-label">
                {t(label)}
                {tab === 'events' && eventCount > 0 && (
                  <span className="workspace-tab-count" aria-hidden="true">
                    {eventCount}
                  </span>
                )}
              </span>
            }
            icon={icon}
            iconPosition="start"
          />
        ))}
        {firstContract && (
          <Tab
            value="api"
            id={`${idPrefix}-tab-api`}
            aria-controls={`${idPrefix}-panel-api`}
            label={t('API 참조')}
            icon={<BookOpenIcon size={16} aria-hidden />}
            iconPosition="start"
          />
        )}
      </Tabs>
    </div>
  );
}

import { useOwpTranslation } from '@owp/components/hooks';
import { Tab, Tabs } from '@mui/material';
import { BracketsCurlyIcon, CodeIcon, DatabaseIcon, PlayIcon } from '@phosphor-icons/react';
import { z } from 'zod';

const tabDefinitions = [
  { value: 'preview', label: '예제', icon: <PlayIcon size={15} aria-hidden /> },
  { value: 'code', label: '코드', icon: <CodeIcon size={16} aria-hidden /> },
  { value: 'data', label: '데이터', icon: <DatabaseIcon size={15} aria-hidden /> },
  { value: 'events', label: '이벤트', icon: <BracketsCurlyIcon size={15} aria-hidden /> },
] as const;
const tabSchema = z.enum(tabDefinitions.map(({ value }) => value));
export type WorkspaceTab = z.infer<typeof tabSchema>;

export function WorkspaceTabs({
  idPrefix,
  value,
  onChange,
  eventCount = 0,
}: {
  readonly idPrefix: string;
  readonly value: WorkspaceTab;
  readonly onChange: (value: WorkspaceTab) => void;
  readonly eventCount?: number;
}) {
  const { t } = useOwpTranslation();
  return (
    <div className="workspace-navigation">
      <Tabs
        value={value}
        onChange={(_, next: unknown) => {
          const result = tabSchema.safeParse(next);
          if (result.success) onChange(result.data);
        }}
        aria-label={t('예제 보기 방식')}
      >
        {tabDefinitions.map(({ value: tab, label, icon }) => (
          <Tab
            key={tab}
            value={tab}
            id={`${idPrefix}-tab-${tab}`}
            aria-controls={`${idPrefix}-panel-${tab}`}
            label={
              tab === 'events' && eventCount > 0
                ? t('이벤트 {{count}}', { count: eventCount })
                : t(label)
            }
            icon={icon}
            iconPosition="start"
          />
        ))}
      </Tabs>
    </div>
  );
}

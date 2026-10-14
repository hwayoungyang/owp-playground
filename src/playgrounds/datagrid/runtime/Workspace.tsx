import { Tab, Tabs } from '@mui/material';
import { BracketsCurlyIcon, CodeIcon, DatabaseIcon, PlayIcon } from '@phosphor-icons/react';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { PreviewThemeSettings } from '../../../features/theme-studio/model/preview';
import { PreviewProvider } from '../../../features/theme-studio/PreviewProvider';
import { SampleHeading } from '../../../shared/ui/SampleHeading';
import { categories, type GridSample } from '../catalog';
import { EventsPanel } from './EventsPanel';
import { GridPreview } from './GridPreview';
import { PreviewStatus } from './PreviewStatus';
import { Settings, type SettingsValue } from './Settings';
import { Toolbar } from './Toolbar';
import { useDemo } from './useDemo';

const CodeViewer = lazy(() =>
  import('../../../features/code/CodeViewer').then((module) => ({ default: module.CodeViewer })),
);
const tabSchema = z.enum(['preview', 'code', 'data', 'events']);
type TabValue = z.infer<typeof tabSchema>;

export function Workspace({
  sample,
  theme,
  onThemeChange,
  onThemeOpen,
}: {
  readonly sample: GridSample;
  readonly theme: PreviewThemeSettings;
  readonly onThemeChange: (next: PreviewThemeSettings) => void;
  readonly onThemeOpen: () => void;
}) {
  const { t } = useTranslation('app');
  const prefix = `sample-${sample.id}`;
  const demo = useDemo(sample);
  const defaultSettings: SettingsValue = {
    selection: demo.definition.rowSelectionMode ?? 'none',
    filter: Boolean(demo.definition.layout?.filterRow),
    compact: false,
    radius: typeof demo.definition.radius === 'number' ? demo.definition.radius : 0,
  };
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<TabValue>('preview');
  const [data, setData] = useState('');
  return (
    <section className="workspace" aria-label={t('샘플 실행 영역')}>
      <SampleHeading
        sample={sample}
        packageTitle="OwpDataGrid"
        categoryLabel={categories.find((entry) => entry.id === sample.category)?.label ?? ''}
      />
      <div className="workspace-navigation">
        <Tabs
          value={tab}
          onChange={(_, value: unknown) => {
            const result = tabSchema.safeParse(value);
            if (result.success) {
              setTab(result.data);
              if (result.data === 'data') {
                const rows = demo.gridRef.current?.getRows() ?? demo.rows;
                setData(
                  JSON.stringify(
                    {
                      totalRows: rows.length,
                      displayedRows: Math.min(100, rows.length),
                      rows: rows.slice(0, 100),
                    },
                    null,
                    2,
                  ),
                );
              }
            }
          }}
          aria-label={t('예제 보기 방식')}
        >
          <Tab
            value="preview"
            id={`${prefix}-tab-preview`}
            aria-controls={`${prefix}-panel-preview`}
            label={t('예제')}
            icon={<PlayIcon size={15} />}
            iconPosition="start"
          />
          <Tab
            value="code"
            id={`${prefix}-tab-code`}
            aria-controls={`${prefix}-panel-code`}
            label={t('코드')}
            icon={<CodeIcon size={16} />}
            iconPosition="start"
          />
          <Tab
            value="data"
            id={`${prefix}-tab-data`}
            aria-controls={`${prefix}-panel-data`}
            label={t('데이터')}
            icon={<DatabaseIcon size={15} />}
            iconPosition="start"
          />
          <Tab
            value="events"
            id={`${prefix}-tab-events`}
            aria-controls={`${prefix}-panel-events`}
            label={`${t('이벤트')}${demo.events.length > 0 ? ` ${demo.events.length}` : ''}`}
            icon={<BracketsCurlyIcon size={15} />}
            iconPosition="start"
          />
        </Tabs>
      </div>
      <div className="specimen-frame">
        <div
          hidden={tab !== 'preview'}
          role="tabpanel"
          id={`${prefix}-panel-preview`}
          aria-labelledby={`${prefix}-tab-preview`}
          aria-label={t('실행 예제')}
        >
          <Toolbar
            sample={sample}
            demo={demo}
            onSettings={() => setSettingsOpen(true)}
            onReset={() => {
              demo.reset();
              setSettings(defaultSettings);
            }}
          />
          <PreviewProvider value={theme}>
            <GridPreview
              key={demo.gridVersion}
              sample={sample}
              demo={demo}
              settings={settings}
              themeRadius={theme.radius}
            />
          </PreviewProvider>
          <PreviewStatus demo={demo} />
        </div>
        {tab === 'code' && (
          <div
            role="tabpanel"
            id={`${prefix}-panel-code`}
            aria-labelledby={`${prefix}-tab-code`}
            aria-label={t('코드')}
          >
            <Suspense
              fallback={<div className="workspace-loading">{t('소스를 불러오는 중…')}</div>}
            >
              <CodeViewer sample={sample} />
            </Suspense>
          </div>
        )}
        {tab === 'data' && (
          <div
            role="tabpanel"
            id={`${prefix}-panel-data`}
            aria-labelledby={`${prefix}-tab-data`}
            aria-label={t('데이터')}
          >
            <Suspense
              fallback={<div className="workspace-loading">{t('데이터를 준비하는 중…')}</div>}
            >
              <CodeViewer sample={sample} data={data} />
            </Suspense>
          </div>
        )}
        {tab === 'events' && (
          <div
            role="tabpanel"
            id={`${prefix}-panel-events`}
            aria-labelledby={`${prefix}-tab-events`}
            aria-label={t('이벤트')}
            className="events-panel"
          >
            <EventsPanel
              events={demo.events}
              onClear={() => demo.setEvents([])}
              onPreview={() => setTab('preview')}
            />
          </div>
        )}
      </div>
      <div className="sample-footnote">
        <span>{t('Props · API')}</span>
        <div>
          {sample.api.map((api) => (
            <code key={api}>{api}</code>
          ))}
        </div>
      </div>
      {sample.id === 'row-span' && (
        <p className="behavior-note">
          {t(
            '1~4번째, 5~8번째처럼 지정한 행 수만큼 병합합니다. 자동 행 병합은 같은 값이 연속된 셀만 묶습니다.',
          )}
        </p>
      )}
      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        value={{ ...settings, radius: theme.radius ?? settings.radius }}
        theme={theme}
        onThemeChange={onThemeChange}
        onThemeOpen={() => {
          setSettingsOpen(false);
          onThemeOpen();
        }}
        onChange={(next) => {
          if (next.selection !== settings.selection) demo.onSelection([]);
          if (next.radius !== (theme.radius ?? settings.radius))
            onThemeChange({ ...theme, radius: next.radius });
          setSettings({ ...next, radius: settings.radius });
        }}
      />
    </section>
  );
}

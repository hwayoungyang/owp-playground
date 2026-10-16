import { lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PreviewThemeSettings } from '../../../features/theme-studio/model/preview';
import { PreviewProvider } from '../../../features/theme-studio/PreviewProvider';
import { SampleHeading } from '../../../shared/ui/SampleHeading';
import { type WorkspaceTab, WorkspaceTabs } from '../../../shared/ui/WorkspaceTabs';
import { categories, type GridSample } from '../catalog';
import { gridApiDocument } from '../model/apiData';
import type { Task } from '../model/data';
import { EventsPanel } from './EventsPanel';
import { GridPreview } from './GridPreview';
import { PreviewStatus } from './PreviewStatus';
import { Settings, type SettingsValue } from './Settings';
import { Toolbar } from './Toolbar';
import { useDemo } from './useDemo';

const ApiDataViewer = lazy(() =>
  import('../../../features/code/ApiDataViewer').then((module) => ({
    default: module.ApiDataViewer,
  })),
);
const CodeViewer = lazy(() =>
  import('../../../features/code/CodeViewer').then((module) => ({ default: module.CodeViewer })),
);

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
  const [tab, setTab] = useState<WorkspaceTab>('preview');
  const [data, setData] = useState<readonly Task[]>([]);
  const apiDocument = useMemo(() => gridApiDocument(data, t), [data, t]);
  return (
    <section className="workspace" aria-label={t('예제 실행 영역')}>
      <SampleHeading
        sample={sample}
        packageTitle="OwpDataGrid"
        categoryLabel={categories.find((entry) => entry.id === sample.category)?.label ?? ''}
      />
      <WorkspaceTabs
        idPrefix={prefix}
        value={tab}
        eventCount={demo.events.length}
        onChange={(next) => {
          setTab(next);
          if (next === 'data') {
            const rows = demo.gridRef.current?.getRows() ?? demo.rows;
            setData(rows);
          } else {
            setData([]);
          }
        }}
      />
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
              <ApiDataViewer sample={sample} document={apiDocument} />
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

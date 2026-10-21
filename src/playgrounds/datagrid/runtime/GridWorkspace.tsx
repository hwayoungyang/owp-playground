import { ApiLinks } from '../../../features/api/ApiLinks';
import { PreviewActionsProvider } from '../../../shared/ui/PreviewActions';
import { useOwpTranslation } from '@owp/components/hooks';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { CodeLocation } from '../../../features/code/code-location';
import type { PreviewThemeSettings } from '../../../features/theme-studio/model/preview';
import { PreviewProvider } from '../../../features/theme-studio/PreviewProvider';
import { EventsPanel } from '../../../shared/ui/EventsPanel';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import { type WorkspaceTab, WorkspaceTabs } from '../../../shared/ui/WorkspaceTabs';
import { categories, type GridExample } from '../catalog';
import { gridApiDocument } from '../model/apiData';
import type { Task } from '../model/data';
import { getGridSourcePolicy } from '../model/sourceFiles';
import { GridPreview } from './GridPreview';
import { GridSettingsDrawer, type GridViewSettings } from './GridSettingsDrawer';
import { GridStatusBar } from './GridStatusBar';
import { GridToolbar } from './GridToolbar';
import { useGridController } from './useGridController';

const ApiDataViewer = lazy(() =>
  import('../../../features/code/ApiDataViewer').then((module) => ({
    default: module.ApiDataViewer,
  })),
);
const CodeViewer = lazy(() =>
  import('../../../features/code/CodeViewer').then((module) => ({ default: module.CodeViewer })),
);

export function GridWorkspace({
  example,
  theme,
  onThemeChange,
  onThemeOpen,
  initialTab = 'preview',
  codeTarget,
}: {
  readonly example: GridExample;
  readonly theme: PreviewThemeSettings;
  readonly onThemeChange: (next: PreviewThemeSettings) => void;
  readonly onThemeOpen: () => void;
  readonly initialTab?: 'preview' | 'code';
  readonly codeTarget?: CodeLocation;
}) {
  const { t } = useOwpTranslation();
  const prefix = `example-${example.id}`;
  const controller = useGridController(example);
  const defaultSettings: GridViewSettings = {
    selection: controller.configuration.rowSelectionMode ?? 'none',
    filter: Boolean(controller.configuration.layout?.filterRow),
    compact: false,
    radius:
      typeof controller.configuration.radius === 'number' ? controller.configuration.radius : 0,
  };
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<WorkspaceTab>(initialTab);
  useEffect(() => setTab(initialTab), [initialTab, codeTarget]);
  const [data, setData] = useState<readonly Task[]>([]);
  const apiDocument = useMemo(() => gridApiDocument(data, t), [data, t]);
  return (
    <section className="workspace" aria-label={t('예제 실행 영역')}>
      <WorkspaceHeading
        example={example}
        packageTitle="OwpDataGrid"
        categoryLabel={categories.find((entry) => entry.id === example.category)?.label ?? ''}
      />
      <WorkspaceTabs
        idPrefix={prefix}
        value={tab}
        eventCount={controller.events.length}
        onChange={(next) => {
          setTab(next);
          if (next === 'data') {
            const rows = controller.gridApi.getRows();
            setData(rows);
          } else {
            setData([]);
          }
        }}
      />
      <div className="workspace-frame" data-rounded={Boolean(theme.radius ?? settings.radius)}>
        <div
          hidden={tab !== 'preview'}
          role="tabpanel"
          id={`${prefix}-panel-preview`}
          aria-labelledby={`${prefix}-tab-preview`}
          aria-label={t('실행 예제')}
        >
          <PreviewActionsProvider>
            <GridToolbar
              example={example}
              controller={controller}
              onSettings={() => setSettingsOpen(true)}
              onReset={() => {
                controller.reset();
                setSettings(defaultSettings);
              }}
            />
            <PreviewProvider value={theme}>
              <GridPreview
                key={controller.gridVersion}
                example={example}
                controller={controller}
                settings={settings}
                themeRadius={theme.radius}
                onSelectionModeChange={(selection) =>
                  setSettings((previous) => ({ ...previous, selection }))
                }
              />
            </PreviewProvider>
          </PreviewActionsProvider>
          <GridStatusBar controller={controller} />
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
              <CodeViewer
                example={example}
                sourcePolicy={getGridSourcePolicy(example.id)}
                codeTarget={codeTarget}
                requestedCode={initialTab === 'code'}
              />
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
              <ApiDataViewer example={example} document={apiDocument} />
            </Suspense>
          </div>
        )}
        {tab === 'events' && (
          <div
            role="tabpanel"
            id={`${prefix}-panel-events`}
            aria-labelledby={`${prefix}-tab-events`}
            aria-label={t('이벤트')}
          >
            <EventsPanel
              events={controller.events}
              limit={40}
              onClear={() => controller.setEvents([])}
              onPreview={() => setTab('preview')}
            />
          </div>
        )}
      </div>
      <ApiLinks example={example} />
      {example.id === 'row-span' && (
        <p className="grid-behavior-note">
          {t(
            '행 수를 4로 지정하면 1~4행, 5~8행처럼 묶어 병합합니다. 자동 행 병합은 같은 값이 연속된 셀을 묶습니다.',
          )}
        </p>
      )}
      <GridSettingsDrawer
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
          if (next.selection !== settings.selection) controller.onSelection([]);
          if (next.radius !== (theme.radius ?? settings.radius))
            onThemeChange({ ...theme, radius: next.radius });
          setSettings({ ...next, radius: settings.radius });
        }}
      />
    </section>
  );
}

import { WorkspaceApiPanels } from '../../../features/public-api/WorkspaceApiPanels';
import { useOwpTranslation } from '@owp/components/hooks';
import { type ComponentType, lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { CodeViewer } from '../../../features/code/CodeViewer';
import { ApiLinks } from '../../../features/api/ApiLinks';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import type { CodeLocation } from '../../../features/code/code-location';
import { PreviewProvider } from '../../../features/theme-studio/PreviewProvider';
import type { PreviewThemeSettings } from '../../../features/theme-studio/model/preview';
import type { EventLogEntry } from '../../../shared/types/events';
import { EventsPanel } from '../../../shared/ui/EventsPanel';
import { PreviewActionsProvider } from '../../../shared/ui/PreviewActions';
import { PreviewToolbar } from '../../../shared/ui/PreviewToolbar';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import {
  type WorkspaceTab,
  WorkspaceTabs,
  resolveWorkspaceTab,
} from '../../../shared/ui/WorkspaceTabs';
import { type ComponentsExample, componentsCategories } from '../catalog';
import type { ComponentsExampleProps } from '../model/types';
import '../styles.css';
import { WorkspaceLoading } from '../../../shared/ui/WorkspaceLoading';

const modules = import.meta.glob<{ ComponentsExample: ComponentType<ComponentsExampleProps> }>(
  '../examples/*.tsx',
);
const previews = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [
    path,
    lazy(async () => ({ default: (await load()).ComponentsExample })),
  ]),
);
const sourcePolicy = { core: [], coreDirectories: ['examples/components/'] } as const;

export function ComponentsWorkspace({
  example,
  initialTab = 'preview',
  codeTarget,
  theme,
}: {
  readonly example: ComponentsExample;
  readonly initialTab?: 'preview' | 'code' | 'props' | 'params' | 'returns' | 'type';
  readonly codeTarget?: CodeLocation;
  readonly theme: PreviewThemeSettings;
}) {
  const { t } = useOwpTranslation();
  const supportedTab = resolveWorkspaceTab(example, initialTab);
  const [tab, setTab] = useState<WorkspaceTab>(supportedTab);
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<Readonly<Record<string, unknown>>>({});
  const [events, setEvents] = useState<readonly EventLogEntry[]>([]);
  useEffect(() => setTab(supportedTab), [supportedTab, codeTarget]);
  const onData = useCallback((next: Readonly<Record<string, unknown>>) => setData(next), []);
  const onRecord = useCallback((name: string, detail: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    setEvents((previous) =>
      [{ id: (previous[0]?.id ?? 0) + 1, time, name, value: detail }, ...previous].slice(0, 50),
    );
  }, []);
  const Example = previews[`../${example.source}`];
  if (!Example) throw new RangeError(`Unknown Components example: ${example.id}`);
  const prefix = `components-${example.id}`;
  return (
    <section
      className="workspace components-workspace"
      data-example-layout={example.layout}
      aria-label={t('Components 실행 영역')}
    >
      <WorkspaceHeading
        example={example}
        packageTitle="owp/components"
        categoryLabel={
          componentsCategories.find((category) => category.id === example.category)?.label ?? ''
        }
      />
      <WorkspaceTabs
        api={example}
        idPrefix={prefix}
        value={tab}
        eventCount={events.length}
        onChange={setTab}
      />
      <div className="workspace-frame">
        <div
          hidden={tab !== 'preview'}
          role="tabpanel"
          id={`${prefix}-panel-preview`}
          aria-labelledby={`${prefix}-tab-preview`}
        >
          <PreviewProvider value={theme}>
            <PreviewActionsProvider>
              <PreviewToolbar
                divider
                onReset={() => {
                  setVersion((value) => value + 1);
                  setData({});
                  setEvents([]);
                }}
              />
              <div className="components-preview">
                <Suspense fallback={<WorkspaceLoading />}>
                  <Example key={`${example.id}-${version}`} onData={onData} onRecord={onRecord} />
                </Suspense>
              </div>
            </PreviewActionsProvider>
          </PreviewProvider>
        </div>
        {tab === 'code' && (
          <div role="tabpanel" id={`${prefix}-panel-code`} aria-labelledby={`${prefix}-tab-code`}>
            <CodeViewer
              example={example}
              sourcePolicy={sourcePolicy}
              codeTarget={codeTarget}
              requestedCode={initialTab === 'code'}
            />
          </div>
        )}
        {tab === 'data' && (
          <div
            className="components-data"
            role="tabpanel"
            id={`${prefix}-panel-data`}
            aria-labelledby={`${prefix}-tab-data`}
          >
            <p>{t('예제의 현재 상태와 데이터를 표시합니다.')}</p>
            <CodeSnippet label="state.json" code={JSON.stringify(data, null, 2)} language="json" />
          </div>
        )}
        {tab === 'events' && (
          <div
            role="tabpanel"
            id={`${prefix}-panel-events`}
            aria-labelledby={`${prefix}-tab-events`}
          >
            <EventsPanel
              events={events}
              limit={50}
              onClear={() => setEvents([])}
              onPreview={() => setTab('preview')}
            />
          </div>
        )}
        <WorkspaceApiPanels example={example} tab={tab} prefix={prefix} onTabChange={setTab} />
      </div>
      <ApiLinks example={example} />
    </section>
  );
}

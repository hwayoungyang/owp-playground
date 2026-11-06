import { useOwpTranslation } from '@owp/components/hooks';
import { type ComponentType, lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { apiHref } from '../../features/api/model/links';
import { CodeSnippet } from '../../features/code/CodeSnippet';
import { CodeViewer } from '../../features/code/CodeViewer';
import type { CodeLocation } from '../../features/code/code-location';
import { exampleSourcePath } from '../../features/code/source-paths';
import { WorkspaceApiPanels } from '../../features/public-api/WorkspaceApiPanels';
import type { EventLogEntry } from '../../shared/types/events';
import { EventsPanel } from '../../shared/ui/EventsPanel';
import { ExampleWorkbench } from '../../shared/ui/ExampleWorkbench';
import { PlaygroundLink } from '../../shared/ui/PlaygroundLink';
import { PreviewActionsProvider } from '../../shared/ui/PreviewActions';
import { PreviewToolbar } from '../../shared/ui/PreviewToolbar';
import { WorkspaceHeading } from '../../shared/ui/WorkspaceHeading';
import { WorkspaceLoading } from '../../shared/ui/WorkspaceLoading';
import {
  type WorkspaceTab,
  WorkspaceTabs,
  resolveWorkspaceTab,
} from '../../shared/ui/WorkspaceTabs';
import { apiPackageIdFor } from '../packages';
import '../components/styles.css';
import './styles.css';
import {
  type IntegrationExample,
  type IntegrationExampleProps,
  integrationCategories,
} from './catalog';

type IntegrationExampleModule = {
  readonly IntegrationExample: ComponentType<IntegrationExampleProps>;
};

export const integrationExampleLoaders: Readonly<
  Record<string, () => Promise<IntegrationExampleModule>>
> = {
  'playgrounds/tailwind-config/examples/utilities.tsx': () =>
    import('../tailwind-config/examples/utilities'),
  'playgrounds/date-picker/examples/date-range-picker.tsx': () =>
    import('../date-picker/examples/date-range-picker'),
  'playgrounds/date-picker/examples/time-picker.tsx': () =>
    import('../date-picker/examples/time-picker'),
  'playgrounds/excel/examples/data-export.tsx': () => import('../excel/examples/data-export'),
  'playgrounds/excel/examples/cell-merge-style.tsx': () =>
    import('../excel/examples/cell-merge-style'),
  'playgrounds/pdf/examples/document-download.tsx': () =>
    import('../pdf/examples/document-download'),
  'playgrounds/pdf/examples/vector-summary.tsx': () => import('../pdf/examples/vector-summary'),
  'playgrounds/theme/examples/theme-mode-preview.tsx': () =>
    import('../theme/examples/theme-mode-preview'),
  'playgrounds/theme/examples/surface-tokens.tsx': () => import('../theme/examples/surface-tokens'),
  'playgrounds/utils/examples/value-format.tsx': () => import('../utils/examples/value-format'),
  'playgrounds/utils/examples/qrcode-generator.tsx': () =>
    import('../utils/examples/qrcode-generator'),
  'playgrounds/utils/examples/barcode-generator.tsx': () =>
    import('../utils/examples/barcode-generator'),
};

const previews = Object.fromEntries(
  Object.entries(integrationExampleLoaders).map(([path, load]) => [
    path,
    lazy(async () => ({ default: (await load()).IntegrationExample })),
  ]),
);

const sourcePolicy = { core: [], coreDirectories: ['examples/'] } as const;

export function IntegrationsWorkspace({
  playground,
  example,
  initialTab = 'preview',
  codeTarget,
}: {
  readonly playground: { readonly id: string; readonly title: string };
  readonly example: IntegrationExample;
  readonly initialTab?: 'preview' | 'code' | 'props' | 'params' | 'returns' | 'type';
  readonly codeTarget?: CodeLocation;
}) {
  const { t, i18n } = useOwpTranslation();
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
  const sourceKey = exampleSourcePath(example);
  const Example = previews[sourceKey];
  if (!Example) throw new RangeError(`Unknown integration example: ${sourceKey}`);
  const prefix = `${playground.id}-${example.id}`;
  const packageId = apiPackageIdFor(example.package);
  return (
    <section
      className="workspace components-workspace integrations-workspace"
      aria-label={t('패키지 실행 영역')}
    >
      <WorkspaceHeading
        example={example}
        packageTitle={playground.title}
        categoryLabel={
          integrationCategories.find((category) => category.id === example.category)?.label ?? ''
        }
      />
      <WorkspaceTabs
        api={example}
        idPrefix={prefix}
        value={tab}
        eventCount={events.length}
        onChange={setTab}
      />
      <ExampleWorkbench
        idPrefix={prefix}
        tab={tab}
        onTabChange={setTab}
        code={
          <div role="tabpanel" id={`${prefix}-panel-code`} aria-labelledby={`${prefix}-tab-code`}>
            <CodeViewer
              example={example}
              sourcePolicy={sourcePolicy}
              codeTarget={codeTarget}
              requestedCode={initialTab === 'code'}
            />
          </div>
        }
      >
        <div
          hidden={tab !== 'preview'}
          role="tabpanel"
          id={`${prefix}-panel-preview`}
          aria-labelledby={`${prefix}-tab-preview`}
        >
          <PreviewActionsProvider>
            <PreviewToolbar
              divider
              className="integrations-preview-toolbar"
              startActions={<span className="integrations-preview-label">{t('미리보기')}</span>}
              onReset={() => {
                setVersion((value) => value + 1);
                setData({});
                setEvents([]);
              }}
            />
            <div className="components-preview integrations-preview">
              <Suspense fallback={<WorkspaceLoading />}>
                <Example key={`${example.id}-${version}`} onData={onData} onRecord={onRecord} />
              </Suspense>
            </div>
          </PreviewActionsProvider>
        </div>
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
      </ExampleWorkbench>
      {example.api.length > 0 && (
        <details className="integration-demo-details integrations-api-reference">
          <summary>{t('관련 API')}</summary>
          <nav className="workspace-api-reference" aria-label={t('관련 API')}>
            <div>
              {example.api.map((name) => {
                const id = `${example.package}:${name}`;
                return (
                  <PlaygroundLink
                    key={id}
                    href={`${apiHref(packageId, id)}&lang=${encodeURIComponent(i18n.language)}`}
                    title={id}
                  >
                    <code>{name}</code>
                  </PlaygroundLink>
                );
              })}
            </div>
          </nav>
        </details>
      )}
    </section>
  );
}

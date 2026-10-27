import { useOwpTranslation } from '@owp/components/hooks';
import { type ComponentType, lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ApiLinks } from '../../../features/api/ApiLinks';
import { CodeViewer } from '../../../features/code/CodeViewer';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import type { CodeLocation } from '../../../features/code/code-location';
import type { EventLogEntry } from '../../../shared/types/events';
import { EventsPanel } from '../../../shared/ui/EventsPanel';
import { PreviewActionsProvider } from '../../../shared/ui/PreviewActions';
import { PreviewToolbar } from '../../../shared/ui/PreviewToolbar';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import { type WorkspaceTab, WorkspaceTabs } from '../../../shared/ui/WorkspaceTabs';
import { type CoreExample, coreCategories } from '../catalog';
import { coreSourcePolicy } from '../model/sourceFiles';
import { coreOwnershipNotes } from '../guides/package-ownership';
import type { CoreExampleProps } from '../model/types';
import { CoreProviders } from './CoreProviders';
import '../styles.css';

const modules = import.meta.glob<{ CoreExample: ComponentType<CoreExampleProps> }>(
  '../examples/*.tsx',
);

function CorePreview({ example, ...props }: CoreExampleProps & { readonly example: CoreExample }) {
  const [Example] = useState(() =>
    lazy(async () => {
      const load = modules[`../examples/${example.id}.tsx`];
      if (!load) throw new RangeError(`Unknown Core example: ${example.id}`);
      return { default: (await load()).CoreExample };
    }),
  );
  const { t } = useOwpTranslation();
  return (
    <Suspense
      fallback={
        <div className="workspace-loading" role="status">
          {t('예제를 불러오는 중…')}
        </div>
      }
    >
      <Example {...props} />
    </Suspense>
  );
}

export function CoreWorkspace({
  example,
  initialTab = 'preview',
  codeTarget,
}: {
  readonly example: CoreExample;
  readonly initialTab?: 'preview' | 'code';
  readonly codeTarget?: CodeLocation;
}) {
  const { t, i18n } = useOwpTranslation();
  const ownership = Object.entries(coreOwnershipNotes).find(([id]) => id === example.id);
  const ownershipGuideUrl = ownership
    ? `?${new URLSearchParams({ package: 'core', sample: 'getting-started', lang: i18n.language })}#core-ownership-${example.id}`
    : undefined;
  const [tab, setTab] = useState<WorkspaceTab>(initialTab);
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<Readonly<Record<string, unknown>>>({});
  const [events, setEvents] = useState<readonly EventLogEntry[]>([]);
  useEffect(() => setTab(initialTab), [initialTab, codeTarget]);
  const onData = useCallback((next: Readonly<Record<string, unknown>>) => setData(next), []);
  const onRecord = useCallback((name: string, detail: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    setEvents((previous) =>
      [{ id: (previous[0]?.id ?? 0) + 1, time, name, value: detail }, ...previous].slice(0, 50),
    );
  }, []);
  const prefix = `core-${example.id}`;
  return (
    <section className="workspace core-workspace" aria-label={t('Core 실행 영역')}>
      <WorkspaceHeading
        example={example}
        packageTitle="owp/core"
        categoryLabel={
          coreCategories.find((category) => category.id === example.category)?.label ?? ''
        }
      />
      {ownershipGuideUrl && (
        <a className="core-ownership-guide-link" href={ownershipGuideUrl}>
          {t('패키지별 역할과 연결 방법 보기')}
        </a>
      )}
      <WorkspaceTabs idPrefix={prefix} value={tab} eventCount={events.length} onChange={setTab} />
      <div className="workspace-frame">
        <div
          hidden={tab !== 'preview'}
          role="tabpanel"
          id={`${prefix}-panel-preview`}
          aria-labelledby={`${prefix}-tab-preview`}
        >
          <PreviewActionsProvider>
            <PreviewToolbar
              className="preview-toolbar--core"
              divider
              onReset={() => {
                setVersion((value) => value + 1);
                setData({});
                setEvents([]);
              }}
            />
            <CoreProviders key={`${example.id}-${version}`} exampleId={example.id}>
              <CorePreview example={example} onRecord={onRecord} onData={onData} />
            </CoreProviders>
          </PreviewActionsProvider>
        </div>
        {tab === 'code' && (
          <div role="tabpanel" id={`${prefix}-panel-code`} aria-labelledby={`${prefix}-tab-code`}>
            <CodeViewer
              example={example}
              sourcePolicy={coreSourcePolicy}
              codeTarget={codeTarget}
              requestedCode={initialTab === 'code'}
            />
          </div>
        )}
        {tab === 'data' && (
          <div
            className="core-data"
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
      </div>
      <ApiLinks example={example} />
    </section>
  );
}

import { PreviewActionsProvider } from '../../../shared/ui/PreviewActions';
import { useOwpTranslation } from '@owp/components/hooks';
import {
  type ComponentType,
  lazy,
  memo,
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiDataViewer } from '../../../features/code/ApiDataViewer';
import { CodeViewer } from '../../../features/code/CodeViewer';
import type { EventLogEntry } from '../../../shared/types/events';
import { EventsPanel } from '../../../shared/ui/EventsPanel';
import { PreviewToolbar } from '../../../shared/ui/PreviewToolbar';
import { WorkspaceHeading } from '../../../shared/ui/WorkspaceHeading';
import { type WorkspaceTab, WorkspaceTabs } from '../../../shared/ui/WorkspaceTabs';
import { type ChartExample, chartCategories } from '../catalog';
import { chartApiDocument } from '../model/apiData';
import { chartSourcePolicy } from '../model/sourceFiles';
import type { ChartExampleProps, ChartSnapshot } from '../model/types';
import { useAvailableChartHeight } from './useAvailableChartHeight';
import '../styles.css';
import '../guides/chart-layout.css';

const modules = import.meta.glob<{ ChartExample: ComponentType<ChartExampleProps> }>(
  '../examples/*.tsx',
);
const ChartPreview = memo(function ChartPreview({
  example,
  ...props
}: ChartExampleProps & { readonly example: ChartExample }) {
  const [Example] = useState(() =>
    lazy(async () => {
      const load = modules[`../examples/${example.id}.tsx`];
      if (!load) throw new RangeError(`Unknown chart example: ${example.id}`);
      return { default: (await load()).ChartExample };
    }),
  );
  const { t } = useOwpTranslation();
  const host = useRef<HTMLElement>(null);
  useAvailableChartHeight(true, host);
  return (
    <section ref={host} className="chart-preview owp-chart-surface" aria-label={t(example.title)}>
      <Suspense
        fallback={
          <div className="chart-loading" role="status">
            {t('차트를 불러오는 중…')}
          </div>
        }
      >
        <Example {...props} />
      </Suspense>
    </section>
  );
});

export function ChartsWorkspace({ example }: { readonly example: ChartExample }) {
  const { t } = useOwpTranslation();
  const [tab, setTab] = useState<WorkspaceTab>('preview');
  const [version, setVersion] = useState(0);
  const [snapshot, setSnapshot] = useState<ChartSnapshot>({ labels: [], series: [] });
  const apiDocument = useMemo(
    () => chartApiDocument(snapshot, example.id, t),
    [snapshot, example.id, t],
  );
  const [events, setEvents] = useState<readonly EventLogEntry[]>([]);
  const onData = useCallback(
    (next: ChartSnapshot) =>
      setSnapshot((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      ),
    [],
  );
  const onRecord = useCallback((name: string, detail: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    setEvents((previous) =>
      [{ id: (previous[0]?.id ?? 0) + 1, time, name, value: detail }, ...previous].slice(0, 50),
    );
  }, []);
  const prefix = `charts-${example.id}`;
  return (
    <section
      className={`workspace charts-workspace${(['gauge', 'doughnut'].includes(example.id) || ('layout' in example && example.layout === 'radial')) && tab === 'preview' ? ' chart-workspace-radial' : ''}`}
      aria-label={t('차트 실행 영역')}
    >
      <WorkspaceHeading
        example={example}
        packageTitle="OwpCharts"
        categoryLabel={
          chartCategories.find((category) => category.id === example.category)?.label ?? ''
        }
      />
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
              divider
              onReset={() => {
                setVersion((value) => value + 1);
                setEvents([]);
              }}
            />
            <ChartPreview
              key={`${example.id}-${version}`}
              example={example}
              onData={onData}
              onRecord={onRecord}
            />
          </PreviewActionsProvider>
          <div className="chart-status" role="status">
            <span>{t('데이터 {{count}}개', { count: snapshot.labels.length })}</span>
            <span>{t('series {{count}}개', { count: snapshot.series.length })}</span>
          </div>
        </div>
        {tab === 'code' && (
          <div role="tabpanel" id={`${prefix}-panel-code`} aria-labelledby={`${prefix}-tab-code`}>
            <CodeViewer example={example} sourcePolicy={chartSourcePolicy} />
          </div>
        )}
        {tab === 'data' && (
          <div
            aria-label={t('데이터')}
            role="tabpanel"
            id={`${prefix}-panel-data`}
            aria-labelledby={`${prefix}-tab-data`}
          >
            <ApiDataViewer example={example} document={apiDocument} />
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
      <div className="workspace-api-reference">
        <span>{t('Props · API')}</span>
        <div>
          {example.api.map((api) => (
            <code key={api}>{api}</code>
          ))}
        </div>
      </div>
    </section>
  );
}

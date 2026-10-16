import { Button } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { type ComponentType, lazy, memo, Suspense, useCallback, useMemo, useState } from 'react';
import { ApiDataViewer } from '../../../features/code/ApiDataViewer';
import { CodeViewer } from '../../../features/code/CodeViewer';
import { SampleHeading } from '../../../shared/ui/SampleHeading';
import { type WorkspaceTab, WorkspaceTabs } from '../../../shared/ui/WorkspaceTabs';
import { useGridAccessibility } from '../../datagrid/runtime/useGridAccessibility';
import { type ChartExample, chartCategories } from '../catalog';
import { chartApiDocument } from '../model/apiData';
import type { ChartExampleProps, ChartSnapshot } from '../model/types';
import { useAvailableChartHeight } from './useAvailableChartHeight';
import { useChartAccessibility } from './useChartAccessibility';
import '../styles.css';
import '../guides/chart-layout.css';

const modules = import.meta.glob<{ ChartExample: ComponentType<ChartExampleProps> }>(
  '../examples/*.tsx',
);
const ChartPreview = memo(function ChartPreview({
  sample,
  ...props
}: ChartExampleProps & { readonly sample: ChartExample }) {
  const [Example] = useState(() =>
    lazy(async () => {
      const load = modules[`../examples/${sample.id}.tsx`];
      if (!load) throw new RangeError(`Unknown chart sample: ${sample.id}`);
      return { default: (await load()).ChartExample };
    }),
  );
  const { t } = useOwpTranslation();
  const host = useGridAccessibility();
  useChartAccessibility(host);
  useAvailableChartHeight(true, host);
  return (
    <section ref={host} className="chart-preview owp-chart-surface" aria-label={t(sample.title)}>
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

export function ChartsWorkspace({ sample }: { readonly sample: ChartExample }) {
  const { t } = useOwpTranslation();
  const [tab, setTab] = useState<WorkspaceTab>('preview');
  const [version, setVersion] = useState(0);
  const [snapshot, setSnapshot] = useState<ChartSnapshot>({ labels: [], series: [] });
  const apiDocument = useMemo(
    () => chartApiDocument(snapshot, sample.id, t),
    [snapshot, sample.id, t],
  );
  const [events, setEvents] = useState<
    readonly { readonly id: number; readonly name: string; readonly detail: string }[]
  >([]);
  const onData = useCallback(
    (next: ChartSnapshot) =>
      setSnapshot((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      ),
    [],
  );
  const onRecord = useCallback(
    (name: string, detail: string) =>
      setEvents((previous) =>
        [{ id: (previous[0]?.id ?? 0) + 1, name, detail }, ...previous].slice(0, 50),
      ),
    [],
  );
  const prefix = `charts-${sample.id}`;
  return (
    <section
      className={`workspace charts-workspace${(['gauge', 'doughnut'].includes(sample.id) || ('layout' in sample && sample.layout === 'radial')) && tab === 'preview' ? ' chart-workspace-radial' : ''}`}
      aria-label={t('차트 실행 영역')}
    >
      <SampleHeading
        sample={sample}
        packageTitle="OwpCharts"
        categoryLabel={
          chartCategories.find((category) => category.id === sample.category)?.label ?? ''
        }
      />
      <WorkspaceTabs idPrefix={prefix} value={tab} onChange={setTab} />
      <div className="specimen-frame">
        <div
          hidden={tab !== 'preview'}
          role="tabpanel"
          id={`${prefix}-panel-preview`}
          aria-labelledby={`${prefix}-tab-preview`}
        >
          <div className="chart-toolbar">
            <Button
              variant="outlined"
              onClick={() => {
                setVersion((value) => value + 1);
                setEvents([]);
              }}
            >
              {t('초기화')}
            </Button>
          </div>
          <ChartPreview
            key={`${sample.id}-${version}`}
            sample={sample}
            onData={onData}
            onRecord={onRecord}
          />
          <div className="chart-status" role="status">
            <span>{t('데이터 {{count}}개', { count: snapshot.labels.length })}</span>
            <span>{t('series {{count}}개', { count: snapshot.series.length })}</span>
            <span>{t('가상 데이터')}</span>
          </div>
        </div>
        {tab === 'code' && (
          <div role="tabpanel" id={`${prefix}-panel-code`} aria-labelledby={`${prefix}-tab-code`}>
            <CodeViewer sample={sample} />
          </div>
        )}
        {tab === 'data' && (
          <div
            aria-label={t('데이터')}
            role="tabpanel"
            id={`${prefix}-panel-data`}
            aria-labelledby={`${prefix}-tab-data`}
          >
            <ApiDataViewer sample={sample} document={apiDocument} />
          </div>
        )}
        {tab === 'events' && (
          <div
            className="chart-events"
            role="tabpanel"
            id={`${prefix}-panel-events`}
            aria-labelledby={`${prefix}-tab-events`}
          >
            <Button variant="outlined" onClick={() => setEvents([])}>
              {t('이벤트 지우기')}
            </Button>
            {events.length ? (
              <ol>
                {events.map((event) => (
                  <li key={event.id}>
                    {event.name} · {event.detail}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="chart-note">{t('아직 기록된 이벤트가 없습니다.')}</p>
            )}
          </div>
        )}
      </div>
      <div className="sample-footnote">
        <span>Props · API</span>
        <div>
          {sample.api.map((api) => (
            <code key={api}>{api}</code>
          ))}
        </div>
      </div>
    </section>
  );
}

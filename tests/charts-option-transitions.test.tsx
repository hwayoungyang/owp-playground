import { Children, isValidElement, type ReactElement, type ReactNode, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';
import { Header } from '../src/app/layout/Header';
import { ChartsWorkspace as LazyChartsWorkspace } from '../src/app/workspaces';
import { ApiLinks } from '../src/features/api/ApiLinks';
import { ApiDataViewer } from '../src/features/code/ApiDataViewer';
import { exampleCodeHref } from '../src/features/code/code-location';
import { chartExecutionCatalog, type ChartExample } from '../src/playgrounds/charts/catalog';
import { chartConsolidations } from '../src/playgrounds/charts/model/consolidations';
import { chartVariantGroups, selectedChartExample } from '../src/playgrounds/charts/model/variants';
import type { ChartExampleProps } from '../src/playgrounds/charts/model/types';
import { ChartCodeViewer } from '../src/playgrounds/charts/runtime/ChartCodeViewer';
import { Choice } from '../src/playgrounds/charts/runtime/Controls';
import { ChartsWorkspace } from '../src/playgrounds/charts/runtime/Workspace';
import {
  chartsPackage,
  createPlaygroundUrl,
  getPlaygroundRoute,
  readPlaygroundRoute,
} from '../src/playgrounds/registry';
import { PreviewToolbar } from '../src/shared/ui/PreviewToolbar';
import { PlaygroundNavigation } from '../src/shared/ui/PlaygroundLink';
import { WorkspaceTabs } from '../src/shared/ui/WorkspaceTabs';

vi.mock('@owp/components/hooks', () => ({
  useOwpTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ko' } }),
}));
vi.mock('../src/features/code/ApiDataViewer', () => ({ ApiDataViewer: () => null }));
vi.mock('../src/playgrounds/charts/runtime/ChartCodeViewer', () => ({
  ChartCodeViewer: () => null,
}));

afterEach(() => vi.unstubAllGlobals());

function elements(tree: ReactNode): readonly ReactElement<{ readonly children?: ReactNode }>[] {
  const found: ReactElement<{ readonly children?: ReactNode }>[] = [];
  Children.forEach(tree, (child) => {
    if (!isValidElement<{ readonly children?: ReactNode }>(child)) return;
    found.push(child, ...elements(child.props.children));
  });
  return found;
}

function element<P>(tree: ReactNode, type: unknown): ReactElement<P> {
  const found = elements(tree).find((child) => child.type === type && isValidElement<P>(child));
  if (!found || !isValidElement<P>(found)) throw new TypeError('The workspace element is missing.');
  return found;
}

function chart(id: string): ChartExample {
  const example = chartExecutionCatalog.find(
    (entry): entry is ChartExample => entry.kind === 'chart' && entry.id === id,
  );
  if (!example) throw new RangeError(`Unknown chart: ${id}`);
  return example;
}

type PreviewProps = ChartExampleProps & {
  readonly example: ChartExample;
  readonly active: boolean;
};
function preview(tree: ReactNode): ReactElement<PreviewProps> {
  const found = elements(tree).find(
    (child) =>
      isValidElement<PreviewProps>(child) &&
      typeof child.props.onData === 'function' &&
      typeof child.props.onRecord === 'function',
  );
  if (!found || !isValidElement<PreviewProps>(found))
    throw new TypeError('The mounted preview is missing.');
  return found;
}

describe('route selected standalone chart configurations', () => {
  it('resolves all 40 choices to their executing entry source and canonical navigation route', () => {
    // Given
    const choices = chartVariantGroups.flatMap((group) =>
      group.choices.map((choice) => ({ canonicalId: group.id, id: choice.id })),
    );

    // When
    const selections = choices.map(({ canonicalId, id }) => {
      const route = getPlaygroundRoute(chartsPackage, id);
      if (route.status !== 'charts' || route.example.kind !== 'chart')
        throw new TypeError('Expected a chart route.');
      const example = selectedChartExample(route.example, route.initialPreset);
      return { canonicalId, id, route, example };
    });

    // Then
    expect(chartVariantGroups).toHaveLength(13);
    expect(selections).toHaveLength(40);
    expect(new Set(selections.map(({ example }) => example.id)).size).toBe(40);
    for (const { canonicalId, id, route, example } of selections) {
      expect(route.example.id, id).toBe(canonicalId);
      expect(example.id, id).toBe(id);
      expect(example.source, id).toBe(`examples/${id}.tsx`);
      expect(
        new URL(createPlaygroundUrl('https://example.test', route)).searchParams.get('sample'),
      ).toBe(id);
      if (id !== canonicalId) expect(chartConsolidations[id], id).toBe(canonicalId);
    }
  });

  it('infers a variant only from the exact entry source in the current group', () => {
    // Given
    const entry = (id: string, file: string) =>
      exampleCodeHref('charts', id, { file, line: 1, endLine: 1 });
    const links = [
      entry('bar', 'playgrounds/charts/examples/grouped-bar.tsx'),
      entry('grouped-bar', 'playgrounds/charts/examples/bar.tsx'),
      entry('grouped-bar', 'playgrounds/charts/model/useCartesian.ts'),
      entry('bar', 'playgrounds/charts/examples/pie.tsx'),
      entry('box-plot', 'playgrounds/charts/examples/native/box-plot.tsx'),
    ];

    // When
    const routes = links.map(readPlaygroundRoute);

    // Then
    expect(routes.map((route) => route.status === 'charts' && route.initialPreset)).toEqual([
      'grouped-bar',
      undefined,
      'grouped-bar',
      undefined,
      undefined,
    ]);
    for (const route of routes) {
      const url = createPlaygroundUrl('https://example.test', route);
      expect(readPlaygroundRoute(url.search)).toEqual(route);
    }
  });

  it('uses the active variant for Code, Data, Related API and the mounted Preview', () => {
    // Given
    const example = chart('grouped-bar');
    const selections: string[] = [];
    function Probe() {
      const [step, setStep] = useState(0);
      const tree = ChartsWorkspace({ example, canonicalId: 'bar', onSelectVariant: () => {} });
      const tabs = element<Parameters<typeof WorkspaceTabs>[0]>(tree, WorkspaceTabs);
      selections.push(preview(tree).props.example.id);
      selections.push(element<Parameters<typeof ApiLinks>[0]>(tree, ApiLinks).props.example.id);
      if (step === 0) tabs.props.onChange('code');
      if (step === 1) {
        selections.push(
          element<Parameters<typeof ChartCodeViewer>[0]>(tree, ChartCodeViewer).props.example.id,
        );
        tabs.props.onChange('data');
      }
      if (step === 2)
        selections.push(
          element<Parameters<typeof ApiDataViewer>[0]>(tree, ApiDataViewer).props.example.id,
        );
      if (step < 2) setStep(step + 1);
      return null;
    }

    // When
    renderToStaticMarkup(<Probe />);

    // Then
    expect(selections).toEqual(Array.from({ length: 8 }, () => 'grouped-bar'));
  });

  it('keeps the same Preview instance, snapshot and events through a tab round trip', () => {
    // Given
    const example = chart('line-interpolation');
    const frames: {
      readonly key: string | null;
      readonly active: boolean;
      readonly events: number;
    }[] = [];
    const dataRows: (readonly unknown[])[] = [];
    function Probe() {
      const [step, setStep] = useState(0);
      const tree = ChartsWorkspace({ example, canonicalId: 'line-style' });
      const tabs = element<Parameters<typeof WorkspaceTabs>[0]>(tree, WorkspaceTabs);
      const current = preview(tree);
      frames.push({
        key: current.key,
        active: current.props.active,
        events: tabs.props.eventCount ?? 0,
      });
      if (step === 0) {
        current.props.onData?.({ labels: ['A'], series: [{ label: 'series', values: [17] }] });
        current.props.onRecord?.('click', '0:0');
        tabs.props.onChange('code');
      }
      if (step === 1) tabs.props.onChange('data');
      if (step === 2) {
        const data = element<Parameters<typeof ApiDataViewer>[0]>(tree, ApiDataViewer);
        dataRows.push(data.props.document.getRows(0, 1));
        tabs.props.onChange('events');
      }
      if (step === 3) tabs.props.onChange('preview');
      if (step < 4) setStep(step + 1);
      return null;
    }

    // When
    renderToStaticMarkup(<Probe />);

    // Then
    expect(new Set(frames.map((frame) => frame.key)).size).toBe(1);
    expect(frames.map((frame) => frame.active)).toEqual([true, false, false, false, true]);
    expect(frames.map((frame) => frame.events)).toEqual([0, 1, 1, 1, 1]);
    expect(dataRows).toEqual([[{ 'OWP_DATA.DATA1': 'A', 'OWP_DATA.DATA2': '17' }]]);
  });

  it('clears the snapshot and events and remounts only Preview when Reset is pressed', () => {
    // Given
    const example = chart('semi-circle');
    const frames: { readonly key: string | null; readonly events: number }[] = [];
    const rowCounts: number[] = [];
    function Probe() {
      const [step, setStep] = useState(0);
      const tree = ChartsWorkspace({ example, canonicalId: 'doughnut' });
      const tabs = element<Parameters<typeof WorkspaceTabs>[0]>(tree, WorkspaceTabs);
      const current = preview(tree);
      frames.push({ key: current.key, events: tabs.props.eventCount ?? 0 });
      if (step === 0) {
        current.props.onData?.({ labels: ['A'], series: [{ label: 'series', values: [17] }] });
        current.props.onRecord?.('legend-click', 'A');
      }
      if (step === 1) {
        element<Parameters<typeof PreviewToolbar>[0]>(tree, PreviewToolbar).props.onReset();
        tabs.props.onChange('data');
      }
      if (step === 2)
        rowCounts.push(
          element<Parameters<typeof ApiDataViewer>[0]>(tree, ApiDataViewer).props.document
            .totalRows,
        );
      if (step < 2) setStep(step + 1);
      return null;
    }

    // When
    renderToStaticMarkup(<Probe />);

    // Then
    expect(frames.map((frame) => frame.events)).toEqual([0, 1, 0]);
    expect(frames[0]?.key).toBe(frames[1]?.key);
    expect(frames[2]?.key).not.toBe(frames[1]?.key);
    expect(rowCounts).toEqual([0]);
  });

  it('ignores the selected choice and emits the route ID for a different choice', () => {
    // Given
    const selected: string[] = [];
    function Probe() {
      const tree = ChartsWorkspace({
        example: chart('grouped-bar'),
        canonicalId: 'bar',
        onSelectVariant: (id) => selected.push(id),
      });
      const control = element<Parameters<typeof Choice>[0]>(tree, Choice);
      control.props.onChange(control.props.value);
      control.props.onChange('Bar');
      return null;
    }

    // When
    renderToStaticMarkup(<Probe />);

    // Then
    expect(selected).toEqual(['horizontal-bar']);
  });

  it('preserves the App workspace key for theme and Code navigation and changes it for a new variant', () => {
    // Given
    const browserUrl = new URL('https://example.test/?package=charts&sample=grouped-bar');
    const pushed: string[] = [];
    vi.stubGlobal('location', browserUrl);
    vi.stubGlobal('history', {
      pushState: (_state: unknown, _unused: string, url: URL) => {
        pushed.push(url.href);
        browserUrl.href = url.href;
      },
    });
    const frames: { readonly key: string | null; readonly header: string | undefined }[] = [];
    function Probe() {
      const [step, setStep] = useState(0);
      const tree = App();
      const workspace = element<Parameters<typeof ChartsWorkspace>[0]>(tree, LazyChartsWorkspace);
      const header = element<Parameters<typeof Header>[0]>(tree, Header);
      frames.push({ key: workspace.key, header: header.props.example?.id });
      if (step === 0) {
        workspace.props.onSelectVariant?.('grouped-bar');
        header.props.onModeChange();
      }
      if (step === 1)
        element<Parameters<typeof PlaygroundNavigation>[0]>(
          tree,
          PlaygroundNavigation,
        ).props.onNavigate(
          exampleCodeHref('charts', 'grouped-bar', {
            file: 'playgrounds/charts/model/useCartesian.ts',
            line: 1,
            endLine: 1,
          }),
        );
      if (step === 2) workspace.props.onSelectVariant?.('horizontal-bar');
      if (step < 3) setStep(step + 1);
      return null;
    }

    // When
    renderToStaticMarkup(<Probe />);

    // Then
    expect(frames.map((frame) => frame.header)).toEqual([
      'grouped-bar',
      'grouped-bar',
      'grouped-bar',
      'horizontal-bar',
    ]);
    expect(frames[0]?.key).toBe(frames[1]?.key);
    expect(frames[1]?.key).toBe(frames[2]?.key);
    expect(frames[2]?.key).not.toBe(frames[3]?.key);
    expect(pushed).toHaveLength(2);
  });
});

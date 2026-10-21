import { useState } from 'react';
import { CodeViewer } from '../../../features/code/CodeViewer';
import type { CodeLocation } from '../../../features/code/code-location';
import type { ChartExample } from '../catalog';
import { chartSourcePolicy } from '../model/sourceFiles';
import { Choice } from './Controls';

const nativeSources = new Map([
  ['box-plot', 'examples/native/box-plot.tsx'],
  ['heatmap', 'examples/native/heatmap.tsx'],
  ['treemap', 'examples/native/treemap.tsx'],
]);
const configurationModes = ['전용 컴포넌트', '직접 구성'] as const;
type ConfigurationMode = (typeof configurationModes)[number];
type Props = {
  readonly example: ChartExample;
  readonly codeTarget?: CodeLocation;
  readonly requestedCode?: boolean;
};

export function ChartCodeViewer(props: Props) {
  const nativeSource = nativeSources.get(props.example.id);
  if (!nativeSource) return <CodeViewer {...props} sourcePolicy={chartSourcePolicy} />;
  return (
    <ConfigurationCode
      key={`${props.example.id}-${props.codeTarget?.file ?? ''}`}
      {...props}
      nativeSource={nativeSource}
    />
  );
}

function ConfigurationCode({
  example,
  codeTarget,
  requestedCode,
  nativeSource,
}: Props & { readonly nativeSource: string }) {
  const initialMode: ConfigurationMode =
    codeTarget?.file === `playgrounds/charts/${nativeSource}` ? '직접 구성' : '전용 컴포넌트';
  const [mode, setMode] = useState<ConfigurationMode>(initialMode);
  const source = mode === '직접 구성' ? nativeSource : example.source;
  return (
    <>
      <div className="chart-controls chart-code-options">
        <Choice label="구성 방식" value={mode} options={configurationModes} onChange={setMode} />
      </div>
      <CodeViewer
        key={source}
        example={{ ...example, source }}
        sourcePolicy={chartSourcePolicy}
        codeTarget={mode === initialMode ? codeTarget : undefined}
        requestedCode={requestedCode}
      />
    </>
  );
}

import {
  ApiReference,
  ChartsGettingStarted,
  ChartsWorkspace,
  ComponentsGettingStarted,
  ComponentsWorkspace,
  CoreGettingStarted,
  CoreWorkspace,
  GridGettingStarted,
  GridWorkspace,
  GuideCodeWorkspace,
  PublicApiWorkspace,
  PackageGettingStarted,
} from './workspaces';
import type { PlaygroundRoute } from '../playgrounds/registry';
import { selectedChartExample } from '../playgrounds/charts/model/variants';
import { CoreEnvironmentScope } from '../playgrounds/core/runtime/CoreEnvironmentScope';
import type { PreviewThemeSettings } from '../features/theme-studio/model/preview';
import { PackageNotice } from './layout/PackageNotice';
import publicApiIndex from 'virtual:public-api/index';

type WorkspaceRouterProps = {
  readonly route: PlaygroundRoute;
  readonly theme: PreviewThemeSettings;
  readonly onThemeChange: (theme: PreviewThemeSettings) => void;
  readonly onThemeOpen: () => void;
  readonly onNavigateExample: (id: string) => void;
  readonly onDataGrid: () => void;
};

export function WorkspaceRouter({
  route,
  theme,
  onThemeChange,
  onThemeOpen,
  onNavigateExample,
  onDataGrid,
}: WorkspaceRouterProps) {
  if (
    (route.status === 'ready' ||
      route.status === 'charts' ||
      route.status === 'core' ||
      route.status === 'components') &&
    route.example.kind === 'guide' &&
    route.tab === 'code'
  ) {
    return (
      <GuideCodeWorkspace
        key={`${route.playground.id}-${route.example.id}`}
        example={route.example}
        codeTarget={route.codeTarget}
      />
    );
  }
  switch (route.status) {
    case 'package-guide':
      return <PackageGettingStarted key={route.playground.id} playground={route.playground} />;
    case 'exports':
      return (
        <PublicApiWorkspace
          key={`${route.packageId}-${route.symbol}`}
          packageId={route.packageId}
          symbol={route.symbol}
        />
      );
    case 'api':
      return route.playground.status === 'available' ||
        !route.symbol ||
        publicApiIndex
          .find((entry) => entry.id === route.playground.id)
          ?.entries.some((entry) => entry.id === route.symbol) ? (
        <PublicApiWorkspace
          key={`${route.playground.id}-${route.symbol}`}
          packageId={route.playground.id}
          symbol={route.symbol}
        />
      ) : (
        <ApiReference
          key={route.playground.id}
          packageId={route.playground.id}
          symbol={route.symbol}
        />
      );
    case 'components':
      return route.example.kind === 'guide' ? (
        <ComponentsGettingStarted key={`components-${route.example.id}`} example={route.example} />
      ) : (
        <ComponentsWorkspace
          key={`components-${route.example.id}`}
          example={route.example}
          initialTab={route.tab}
          codeTarget={route.codeTarget}
          theme={theme}
        />
      );
    case 'core':
      return route.example.kind === 'guide' ? (
        <CoreGettingStarted key={`core-${route.example.id}`} example={route.example} />
      ) : (
        <CoreEnvironmentScope>
          <CoreWorkspace
            key={`core-${route.example.id}`}
            example={route.example}
            initialTab={route.tab}
            codeTarget={route.codeTarget}
          />
        </CoreEnvironmentScope>
      );
    case 'charts': {
      if (route.example.kind === 'guide')
        return <ChartsGettingStarted key={`charts-${route.example.id}`} example={route.example} />;
      const selected = selectedChartExample(route.example, route.initialPreset);
      return (
        <ChartsWorkspace
          key={`charts-${selected.id}`}
          example={selected}
          canonicalId={route.example.id}
          initialTab={route.tab}
          codeTarget={route.codeTarget}
          onSelectVariant={(id) => {
            if (id !== selected.id) onNavigateExample(id);
          }}
        />
      );
    }
    case 'ready':
      return route.example.kind === 'guide' ? (
        <GridGettingStarted key={route.example.id} example={route.example} />
      ) : (
        <GridWorkspace
          key={route.example.id}
          example={route.example}
          initialTab={route.tab}
          codeTarget={route.codeTarget}
          theme={theme}
          onThemeChange={onThemeChange}
          onThemeOpen={onThemeOpen}
        />
      );
    case 'planned':
      return <PackageNotice onDataGrid={onDataGrid} />;
    default:
      return assertNever(route);
  }
}

function assertNever(route: never): never {
  throw new RangeError(`Unknown Playground route: ${String(route)}`);
}

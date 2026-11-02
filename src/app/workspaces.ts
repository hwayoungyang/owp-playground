import { lazy } from 'react';

export const PackageGettingStarted = lazy(() =>
  import('../playgrounds/PackageGettingStarted').then((module) => ({
    default: module.PackageGettingStarted,
  })),
);

export const PublicApiWorkspace = lazy(() =>
  import('../features/public-api/PublicApiWorkspace').then((module) => ({
    default: module.PublicApiWorkspace,
  })),
);

export const ComponentsApiReference = lazy(() =>
  import('../playgrounds/components/api/ComponentsApiReference').then((module) => ({
    default: module.ComponentsApiReference,
  })),
);

export const ComponentsWorkspace = lazy(() =>
  import('../playgrounds/components/runtime/Workspace').then((module) => ({
    default: module.ComponentsWorkspace,
  })),
);

export const ComponentsGettingStarted = lazy(() =>
  import('../playgrounds/components/guides/GettingStarted').then((module) => ({
    default: module.ComponentsGettingStarted,
  })),
);

export const CoreWorkspace = lazy(() =>
  import('../playgrounds/core/runtime/Workspace').then((module) => ({
    default: module.CoreWorkspace,
  })),
);
export const CoreGettingStarted = lazy(() =>
  import('../playgrounds/core/guides/GettingStarted').then((module) => ({
    default: module.CoreGettingStarted,
  })),
);

export const GuideCodeWorkspace = lazy(() =>
  import('../features/code/GuideCodeWorkspace').then((module) => ({
    default: module.GuideCodeWorkspace,
  })),
);

export const GridWorkspace = lazy(() =>
  import('../playgrounds/datagrid/runtime/GridWorkspace').then((module) => ({
    default: module.GridWorkspace,
  })),
);

export const GridGettingStarted = lazy(() =>
  import('../playgrounds/datagrid/guides/GridGettingStarted').then((module) => ({
    default: module.GridGettingStarted,
  })),
);
export const ThemeStudio = lazy(() =>
  import('../features/theme-studio/ThemeStudio').then((module) => ({
    default: module.ThemeStudio,
  })),
);

export const ChartsWorkspace = lazy(() =>
  import('../playgrounds/charts/runtime/Workspace').then((module) => ({
    default: module.ChartsWorkspace,
  })),
);
export const ChartsGettingStarted = lazy(() =>
  import('../playgrounds/charts/guides/GettingStarted').then((module) => ({
    default: module.ChartsGettingStarted,
  })),
);
export const ApiReference = lazy(() =>
  import('../features/api/ApiReference').then((module) => ({ default: module.ApiReference })),
);

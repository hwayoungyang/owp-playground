import { z } from 'zod';

export const playgroundPackageIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);

export const chartsReferencePackages = [
  'chart.js',
  'react-chartjs-2',
  'chartjs-plugin-annotation',
  'chartjs-plugin-datalabels',
] as const;

export function referencePackagesFor(packageId: string): readonly string[] {
  return packageId === 'charts' ? chartsReferencePackages : [];
}

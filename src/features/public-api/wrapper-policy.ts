export const wrappedPublicApis = [
  {
    packageId: 'core',
    name: 'useTranslation',
    wrapper: '@owp/components:useOwpTranslation',
  },
  {
    packageId: 'core',
    name: 'QueryClientProvider',
    wrapper: '@owp/core:OwpCoreProvider',
  },
  ...['useQuery', 'useSuspenseQuery', 'useMutation', 'queryOptions'].map((name) => ({
    packageId: 'core',
    name,
    wrapper: '@owp/core:createOwpApiHooks',
  })),
] as const;

export function publicApiWrapper(packageId: string, name: string): string | undefined {
  return wrappedPublicApis.find((entry) => entry.packageId === packageId && entry.name === name)
    ?.wrapper;
}

import { useDataGridApi } from '@owp/datagrid/hooks';
import { createInstance } from 'i18next';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { HookConnectionGrid } from '../src/playgrounds/datagrid/examples/hook-connection';
import { RefConnectionGrid } from '../src/playgrounds/datagrid/examples/ref-connection';
import type { Task, TaskGridProps } from '../src/playgrounds/datagrid/types';

type GridApi = NonNullable<TaskGridProps['api']>;

async function createTranslation() {
  const i18n = createInstance();
  await i18n.init({
    lng: 'ko',
    fallbackLng: 'ko',
    defaultNS: 'owp',
    ns: ['owp'],
    keySeparator: false,
    nsSeparator: false,
    resources: { ko: { owp: {} } },
    initAsync: false,
  });
  return i18n;
}

const examples = [
  ['Hook', HookConnectionGrid],
  ['Ref', RefConnectionGrid],
] as const;

describe('DataGrid connection examples during server rendering', () => {
  it.each(examples)(
    'renders standalone %s controls without reading an unconnected API',
    async (_, Component) => {
      // Given: the real example has no parent controller or API object.
      const i18n = await createTranslation();

      // When: React renders the example without mounting client effects.
      const markup = renderToStaticMarkup(
        <I18nextProvider i18n={i18n}>
          <Component />
        </I18nextProvider>,
      );

      // Then: both actions render and no query result is announced before a query.
      expect(markup.match(/<button\b/g)).toHaveLength(2);
      expect(markup).not.toContain('role="status"');
      expect(markup).toContain('class="example-grid"');
    },
  );

  it.each(examples)(
    'accepts a real supplied API for %s without calling it before connection',
    async (_, Component) => {
      // Given: the API comes from the public hook in the parent React owner.
      const i18n = await createTranslation();
      const captured: GridApi[] = [];
      const actions: unknown[] = [];
      function ApiOwner() {
        const api = useDataGridApi<Task>();
        captured.push(api);
        return (
          <Component api={api} callbacks={{ onAction: (...action) => actions.push(action) }} />
        );
      }

      // When: the real example renders before client connection effects can run.
      renderToStaticMarkup(
        <I18nextProvider i18n={i18n}>
          <ApiOwner />
        </I18nextProvider>,
      );

      // Then: rendering emits no API event and leaves the native API unconnected.
      const api = captured[0];
      if (!api) throw new TypeError('Missing parent Grid API');
      expect(actions).toEqual([]);
      expect(() => api.getRows()).toThrow(ReferenceError);
      expect(() => api.focusCell('task-1', 'task')).toThrow(ReferenceError);
    },
  );

  it('isolates API owners across examples and separate server renders', async () => {
    // Given: each example receives an API created by its own parent owner.
    const i18n = await createTranslation();
    const captured: GridApi[] = [];
    function ApiOwner({ Component }: { readonly Component: ComponentType<TaskGridProps> }) {
      const api = useDataGridApi<Task>();
      captured.push(api);
      return <Component api={api} />;
    }
    const tree = (
      <I18nextProvider i18n={i18n}>
        <ApiOwner Component={HookConnectionGrid} />
        <ApiOwner Component={RefConnectionGrid} />
      </I18nextProvider>
    );

    // When: React handles two independent server render requests.
    renderToStaticMarkup(tree);
    renderToStaticMarkup(tree);

    // Then: none of the real hook objects is reused across owners or requests.
    expect(captured).toHaveLength(4);
    expect(new Set(captured).size).toBe(4);
    for (const api of captured) expect(() => api.getRows()).toThrow(ReferenceError);
  });
});

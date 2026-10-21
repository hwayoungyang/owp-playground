import { createInstance } from 'i18next';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { TaskStatusCell } from '../src/playgrounds/datagrid/examples/components/TaskStatusCell';
import { createTaskRendererColumns } from '../src/playgrounds/datagrid/examples/configs/taskRenderer';
import { createTaskValidationColumns } from '../src/playgrounds/datagrid/examples/configs/taskValidation';
import { seedTask } from '../src/playgrounds/datagrid/model/data';

async function createTranslation(language: string) {
  const i18n = createInstance();
  await i18n.init({
    lng: language,
    fallbackLng: 'ko',
    initAsync: false,
    resources: {
      ko: { owp: { 완료: '완료 상태', '완료 수량은 계획 수량을 넘을 수 없습니다.': '수량 초과' } },
      en: {
        owp: { 완료: 'Finished', '완료 수량은 계획 수량을 넘을 수 없습니다.': 'Quantity limit' },
      },
    },
  });
  return i18n;
}

describe('DataGrid sample translation ownership', () => {
  it.each([
    ['ko', '완료 상태'],
    ['en', 'Finished'],
  ])('renders status cells from the active OWP provider in %s', async (language, expected) => {
    // Given: the cell belongs to a provider with its own translations.
    const i18n = await createTranslation(language);

    // When: the real cell renders using the public hook.
    const markup = renderToStaticMarkup(
      <I18nextProvider i18n={i18n}>
        <TaskStatusCell status="완료" className="status-1" />
      </I18nextProvider>,
    );

    // Then: the cell reads its provider instead of the global application instance.
    expect(markup).toContain(expected);
  });

  it('uses the supplied locale for validation without changing the numeric rule', async () => {
    // Given: localized columns and a row with a fixed planned quantity.
    const i18n = await createTranslation('en');
    const column = createTaskValidationColumns(i18n.getFixedT('en', 'owp')).find(
      (item) => item.id === 'completed',
    );
    if (!column?.validate) throw new TypeError('Missing completed quantity validator');
    const row = { ...seedTask, quantity: 10 };

    // When: the completed quantity exceeds the same limit used by the sample.
    const result = column.validate({
      row,
      rowId: row.id,
      depth: 0,
      column,
      value: 11,
      isChanged: true,
    });

    // Then: the error comes from the supplied locale.
    expect(result).toBe('Quantity limit');
  });

  it('localizes Excel values while preserving the stored status', async () => {
    // Given: the renderer factory receives the active OWP translator.
    const i18n = await createTranslation('en');
    const column = createTaskRendererColumns(i18n.getFixedT('en', 'owp')).find(
      (item) => item.id === 'status',
    );
    if (!column || !column.excel || !column.excel.valueGetter)
      throw new TypeError('Missing status export formatter');
    const row = { ...seedTask, status: '완료' };

    // When: Excel asks for a display value.
    const value = column.excel.valueGetter({
      row,
      rowId: row.id,
      depth: 0,
      column,
      value: row.status,
      formattedValue: row.status,
      isChanged: false,
    });

    // Then: localization changes the export value and keeps the row value intact.
    expect({ value, status: row.status }).toEqual({ value: 'Finished', status: '완료' });
  });
});

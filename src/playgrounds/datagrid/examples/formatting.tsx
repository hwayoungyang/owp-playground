import './styles.css';
import type { SelectChangeEvent } from '@mui/material';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { useOwpTranslation } from '@owp/components/hooks';
import { MenuItem, Select } from '@mui/material';
import { OwpDataGrid } from '@owp/datagrid';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { getRowId } from '../model/data';
import type { TaskGridProps } from '../types';
import {
  numberDateFormatsFractionDigits,
  numberDateFormatsColumns,
  numberDateFormatsConfiguration,
} from './configs/numberDateFormats';

export { numberDateFormatsConfiguration as gridConfiguration } from './configs/numberDateFormats';
const fractionDigitsSchema = z.coerce.number().int().min(1).max(6);

export function NumberDateFormatsGrid(props: TaskGridProps = {}) {
  const { gridRef, callbacks, ...gridProps } = props;
  const { t } = useOwpTranslation();
  const [precision, setPrecision] = useState(2);
  const currentColumns = useMemo(
    () =>
      (gridProps.columns ?? numberDateFormatsColumns).map((column) =>
        column.id === 'cost'
          ? {
              ...column,
              numberOptions: {
                ...column.numberOptions,
                minimumFractionDigits: precision,
                maximumFractionDigits: precision,
              },
              excel: { ...column.excel, numFmt: `#,##0.${'0'.repeat(precision)}` },
            }
          : column,
      ),
    [gridProps.columns, precision],
  );
  function handlePrecisionChange(event: SelectChangeEvent<number>) {
    const result = fractionDigitsSchema.safeParse(event.target.value);
    if (result.success) setPrecision(result.data);
  }

  return (
    <div className="example-with-controls" style={{ height: props.height ?? 420 }}>
      <PreviewActions>
        <div className="example-controls">
          <label htmlFor="amount-precision">{t('금액 소수 자릿수')}</label>
          <Select
            id="amount-precision"
            value={precision}
            inputProps={{ 'aria-label': t('금액 소수 자릿수') }}
            onChange={handlePrecisionChange}
          >
            {numberDateFormatsFractionDigits.map((digits) => (
              <MenuItem key={digits} value={digits}>
                {digits}
              </MenuItem>
            ))}
          </Select>
        </div>
      </PreviewActions>
      <div className="example-grid">
        <OwpDataGrid
          ref={gridRef}
          rows={numberDateFormatsConfiguration.rows}
          getRowId={getRowId}
          rowSelectionMode="multiple"
          {...gridProps}
          columns={currentColumns}
          height="100%"
        />
      </div>
    </div>
  );
}

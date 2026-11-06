import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import {
  createExcelExport,
  downloadExcelBuffer,
  type ExcelColumnMapping,
  type ExcelHeader,
} from '@owp/excel';
import {
  Alert,
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

const exportRows = [
  { code: 'LINE-A1', item: '고속 포장 설비', quantity: 120, rate: 98, budget: 4800 },
  { code: 'LINE-B2', item: '비전 검사 모듈', quantity: 85, rate: 96, budget: 3200 },
  { code: 'LINE-C3', item: '자동 분류 컨베이어', quantity: 150, rate: 99, budget: 6100 },
] as const;

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const mountedRef = useRef(true);
  const pendingRef = useRef(false);
  const [fileName, setFileName] = useState('production-lines');
  const [currencyPrefix, setCurrencyPrefix] = useState<'₩ ' | '$ '>('₩ ');
  const [includeUnitSuffix, setIncludeUnitSuffix] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'buffer' | 'download'>('buffer');
  const [lastResult, setLastResult] = useState<{
    readonly exportName: string;
    readonly byteLength: number;
    readonly downloaded: boolean;
  } | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const headers: ExcelHeader[] = [
    { address: 'A1', value: t('라인 코드') },
    { address: 'B1', value: t('설비명') },
    { address: 'C1', value: t('처리 수량') },
    { address: 'D1', value: t('가동률') },
    { address: 'E1', value: t('예산') },
  ];

  const columnMappings: ExcelColumnMapping[] = [
    { key: 'code' },
    { key: 'item' },
    { key: 'quantity', ...(includeUnitSuffix ? { suffix: t('건') } : {}) },
    { key: 'rate', ...(includeUnitSuffix ? { suffix: '%' } : {}) },
    { key: 'budget', prefix: currencyPrefix },
  ];

  const localizedRows = exportRows.map((row) => ({
    ...row,
    item: t(row.item),
  }));

  useEffect(() => {
    onData({
      fileName,
      currencyPrefix,
      includeUnitSuffix,
      busy,
      errorMessage,
      lastResult,
      rowCount: exportRows.length,
    });
  }, [fileName, currencyPrefix, includeUnitSuffix, busy, errorMessage, lastResult, onData]);

  async function runExport(mode: 'buffer' | 'download', requestedFileName = fileName) {
    if (pendingRef.current) return;
    setLastAction(mode);
    const trimmedName = requestedFileName.trim();
    if (!trimmedName) {
      setErrorMessage(t('파일명을 입력한 뒤 다시 시도해 주세요.'));
      onRecord('excel.export.error', 'Empty exportName');
      return;
    }
    pendingRef.current = true;
    setBusy(true);
    setErrorMessage(null);
    onRecord(`excel.${mode}.start`, trimmedName);
    try {
      const { buffer, exportName } = await createExcelExport({
        header: headers,
        columnMappings,
        data: localizedRows,
        exportName: trimmedName,
      });
      if (!mountedRef.current) return;
      if (mode === 'download') {
        downloadExcelBuffer(buffer, exportName);
      }
      const summary = {
        exportName,
        byteLength: buffer.byteLength,
        downloaded: mode === 'download',
      };
      setLastResult(summary);
      onRecord(`excel.${mode}.success`, `${exportName}.xlsx (${buffer.byteLength} bytes)`);
    } catch (error) {
      if (!mountedRef.current) return;
      const message =
        error instanceof Error
          ? error.message
          : t('Excel 버퍼를 생성하지 못했습니다. 다시 시도해 주세요.');
      setErrorMessage(message);
      onRecord(`excel.${mode}.error`, message);
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  return (
    <>
      <section className="components-example-section" aria-label={t('매퍼 설정과 Excel 버퍼 생성')}>
        <div className="components-example-content">
          <div className="components-example-grid">
            <TextField
              size="small"
              fullWidth
              label={t('내보낼 파일명')}
              value={fileName}
              disabled={busy}
              helperText={t('특수문자는 안전한 파일명으로 정규화됩니다.')}
              onChange={(event) => {
                setFileName(event.target.value);
                setErrorMessage(null);
              }}
            />
          </div>
          <div className="integration-demo-controls">
            <ToggleButtonGroup
              className="integration-choice"
              size="small"
              exclusive
              value={currencyPrefix}
              disabled={busy}
              aria-label="prefix"
              onChange={(_, next: string | null) => {
                if (next !== '₩ ' && next !== '$ ') return;
                setCurrencyPrefix(next);
                onRecord('excel.mapper.prefix', next);
              }}
            >
              <ToggleButton value="₩ ">₩</ToggleButton>
              <ToggleButton value="$ ">$</ToggleButton>
            </ToggleButtonGroup>
            <FormControlLabel
              label={t('단위 suffix')}
              control={
                <Switch
                  size="small"
                  checked={includeUnitSuffix}
                  disabled={busy}
                  onChange={(_, checked) => {
                    setIncludeUnitSuffix(checked);
                    onRecord('excel.mapper.suffix', String(checked));
                  }}
                />
              }
            />
          </div>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              loading={busy && lastAction === 'buffer'}
              disabled={busy}
              onClick={() => void runExport('buffer')}
            >
              {t('Excel 파일 생성')}
            </Button>
            <Button
              size="small"
              variant="contained"
              loading={busy && lastAction === 'download'}
              disabled={busy}
              onClick={() => void runExport('download')}
            >
              {t('Excel 다운로드')}
            </Button>
          </Stack>
          {errorMessage && (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  disabled={busy}
                  onClick={() => {
                    const nextFileName = fileName.trim() || 'production-lines';
                    setFileName(nextFileName);
                    void runExport(lastAction, nextFileName);
                  }}
                >
                  {t('다시 시도')}
                </Button>
              }
            >
              {errorMessage}
            </Alert>
          )}
          {lastResult && !errorMessage && (
            <DemoResultTable
              label={t('생성 파일')}
              rows={[
                {
                  label: t('파일명'),
                  value: `${lastResult.exportName}.xlsx`,
                },
                { label: t('파일 크기'), value: `${lastResult.byteLength.toLocaleString()} bytes` },
                {
                  label: t('실행한 동작'),
                  value: lastResult.downloaded ? t('Excel 다운로드') : t('Excel 파일 생성'),
                },
              ]}
            />
          )}
        </div>
      </section>

      <section className="components-example-section" aria-label={t('내보낼 데이터')}>
        <h2>{t('내보낼 데이터')}</h2>
        <div className="components-example-content">
          <div className="integration-table-scroll">
            <OwpTable
              sx={{ '& th, & td': { textAlign: 'left' } }}
              size="small"
              aria-label={t('매핑된 워크시트 행')}
              headers={{
                code: t('라인 코드') + ' (A1)',
                item: t('설비명') + ' (B1)',
                quantity: t('처리 수량') + ' (C1)',
                rate: t('가동률') + ' (D1)',
                budget: t('예산') + ' (E1)',
              }}
              rows={localizedRows.map((row) => ({
                ...row,
                quantity: String(row.quantity) + (includeUnitSuffix ? t('건') : ''),
                rate: String(row.rate) + (includeUnitSuffix ? '%' : ''),
                budget: currencyPrefix + row.budget,
              }))}
            />
          </div>
        </div>
      </section>
    </>
  );
}

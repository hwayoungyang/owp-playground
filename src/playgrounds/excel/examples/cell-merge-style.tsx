import { useOwpTranslation } from '@owp/components/hooks';
import {
  DEFAULT_CELL_ALIGNMENT,
  DEFAULT_HEADER_FILL,
  DEFAULT_HEADER_FONT,
  exportExcelByBuffer,
  getIndexByLetters,
  getLettersByIndex,
  loadExcelJSBrowser,
  setCellValue,
  setMergeCells,
} from '@owp/excel';
import {
  Alert,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

const highlightOptions = [
  { id: 'sky', label: '스카이 블루', argb: 'FFE0F2FE' },
  { id: 'amber', label: '앰버', argb: 'FFFEF3C7' },
  { id: 'emerald', label: '에메랄드', argb: 'FFD1FAE5' },
] as const;

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const mountedRef = useRef(true);
  const pendingRef = useRef(false);
  const [sheetTitle, setSheetTitle] = useState('2026년 4분기 품질 점검표');
  const [highlightId, setHighlightId] = useState<(typeof highlightOptions)[number]['id']>('sky');
  const [columnIndexInput, setColumnIndexInput] = useState(4);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<'inspect' | 'download'>('inspect');
  const [workbookSummary, setWorkbookSummary] = useState<{
    readonly byteLength: number;
    readonly mergedRanges: readonly string[];
    readonly highlightArgb: string;
    readonly downloaded: boolean;
  } | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const selectedHighlight =
    highlightOptions.find((option) => option.id === highlightId) ?? highlightOptions[0];
  const convertedLetter = getLettersByIndex(columnIndexInput);
  const convertedIndex = getIndexByLetters(convertedLetter);

  useEffect(() => {
    onData({
      sheetTitle,
      highlightId,
      highlightArgb: selectedHighlight.argb,
      columnIndexInput,
      convertedLetter,
      convertedIndex,
      busy,
      errorMessage,
      workbookSummary,
    });
  }, [
    sheetTitle,
    highlightId,
    selectedHighlight.argb,
    columnIndexInput,
    convertedLetter,
    convertedIndex,
    busy,
    errorMessage,
    workbookSummary,
    onData,
  ]);

  const qualityRows = [
    ['QC-101', t('장력 편차'), '0.12 mm', t('적합')],
    ['QC-102', t('온도 안정성'), '24.1 °C', t('적합')],
  ] as const;

  async function buildStyledWorkbook(mode: 'inspect' | 'download', requestedTitle = sheetTitle) {
    if (pendingRef.current) return;
    setLastMode(mode);
    const title = requestedTitle.trim();
    if (!title) {
      setErrorMessage(t('병합 제목을 입력한 뒤 다시 시도해 주세요.'));
      onRecord('excel.merge.error', 'Empty sheetTitle');
      return;
    }
    pendingRef.current = true;
    setBusy(true);
    setErrorMessage(null);
    onRecord(`excel.merge.${mode}`, title);
    try {
      const ExcelJS = await loadExcelJSBrowser();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Quality Report');
      worksheet.properties.defaultRowHeight = 22;

      setMergeCells(worksheet, {
        range: 'A1:D1',
        value: title,
        isHeader: true,
        font: { ...DEFAULT_HEADER_FONT, size: 13 },
        alignment: DEFAULT_CELL_ALIGNMENT,
        fill: DEFAULT_HEADER_FILL,
      });
      setMergeCells(worksheet, {
        range: 'A2:B2',
        value: t('점검 대상'),
        isHeader: true,
      });
      setMergeCells(worksheet, {
        range: 'C2:D2',
        value: t('측정 결과'),
        isHeader: true,
      });

      const subHeaders = [t('공정 코드'), t('항목'), t('측정치'), t('판정')];
      subHeaders.forEach((label, idx) => {
        setCellValue(worksheet, {
          key: `${getLettersByIndex(idx + 1)}3`,
          value: label,
          isHeader: true,
        });
        worksheet.getColumn(idx + 1).width = 18;
      });

      qualityRows.forEach((cells, rowIdx) => {
        const rowNumber = rowIdx + 4;
        cells.forEach((cellValue, colIdx) => {
          const isStatus = colIdx === 3;
          setCellValue(worksheet, {
            key: `${getLettersByIndex(colIdx + 1)}${rowNumber}`,
            value: cellValue,
            alignment: DEFAULT_CELL_ALIGNMENT,
            fill: isStatus
              ? {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: selectedHighlight.argb },
                }
              : undefined,
          });
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      if (!mountedRef.current) return;
      if (mode === 'download') {
        exportExcelByBuffer(buffer, 'quality-merge-report');
      }
      const summary = {
        byteLength: buffer.byteLength,
        mergedRanges: ['A1:D1', 'A2:B2', 'C2:D2'],
        highlightArgb: selectedHighlight.argb,
        downloaded: mode === 'download',
      };
      setWorkbookSummary(summary);
      onRecord('excel.merge.success', `${buffer.byteLength} bytes (${selectedHighlight.argb})`);
    } catch (error) {
      if (!mountedRef.current) return;
      const message =
        error instanceof Error
          ? error.message
          : t('워크시트 서식을 구성하지 못했습니다. 다시 시도해 주세요.');
      setErrorMessage(message);
      onRecord('excel.merge.error', message);
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  return (
    <>
      <section className="components-example-section" aria-label={t('병합 헤더와 셀 서식 구성')}>
        <div className="components-example-content">
          <div className="components-example-grid">
            <TextField
              size="small"
              fullWidth
              label={t('A1:D1 병합 제목')}
              value={sheetTitle}
              disabled={busy}
              onChange={(event) => {
                setSheetTitle(event.target.value);
                setErrorMessage(null);
              }}
            />
          </div>
          <ToggleButtonGroup
            className="integration-choice"
            size="small"
            exclusive
            value={highlightId}
            disabled={busy}
            aria-label={t('강조색')}
            onChange={(_, next: string | null) => {
              const option = highlightOptions.find((item) => item.id === next);
              if (!option) return;
              setHighlightId(option.id);
              onRecord('excel.merge.highlight', option.argb);
            }}
          >
            {highlightOptions.map((option) => (
              <ToggleButton key={option.id} value={option.id}>
                {t(option.label)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              loading={busy && lastMode === 'inspect'}
              disabled={busy}
              onClick={() => void buildStyledWorkbook('inspect')}
            >
              {t('Excel 파일 생성')}
            </Button>
            <Button
              size="small"
              variant="contained"
              loading={busy && lastMode === 'download'}
              disabled={busy}
              onClick={() => void buildStyledWorkbook('download')}
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
                    const nextTitle = sheetTitle.trim() || '2026년 4분기 품질 점검표';
                    setSheetTitle(nextTitle);
                    void buildStyledWorkbook(lastMode, nextTitle);
                  }}
                >
                  {t('다시 시도')}
                </Button>
              }
            >
              {errorMessage}
            </Alert>
          )}
          {workbookSummary && !errorMessage && (
            <DemoResultTable
              label={t('생성 파일')}
              rows={[
                {
                  label: t('파일 크기'),
                  value: `${workbookSummary.byteLength.toLocaleString()} bytes`,
                },
                {
                  label: t('병합 범위'),
                  value: workbookSummary.mergedRanges.join(', '),
                },
              ]}
            />
          )}
        </div>
      </section>

      <section className="components-example-section" aria-label={t('워크시트 미리보기')}>
        <h2>{t('워크시트 미리보기')}</h2>
        <div className="components-example-content">
          <div className="integration-table-scroll">
            <Table size="small" aria-label={t('워크시트 미리보기')}>
              <TableHead>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    sx={{ textAlign: 'center', bgcolor: 'var(--pg-subtle)', fontWeight: 600 }}
                  >
                    {sheetTitle || '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    {t('점검 대상')}
                  </TableCell>
                  <TableCell colSpan={2} align="center">
                    {t('측정 결과')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  {['공정 코드', '항목', '측정치', '판정'].map((label) => (
                    <TableCell key={label}>{t(label)}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {qualityRows.map((row) => (
                  <TableRow key={row[0]}>
                    {row.map((value, index) => (
                      <TableCell
                        key={index}
                        sx={
                          index === 3
                            ? { bgcolor: '#' + selectedHighlight.argb.slice(2), color: '#0f172a' }
                            : undefined
                        }
                      >
                        {value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <details>
            <summary>{t('컬럼 번호 ↔ 열 문자')}</summary>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {[1, 4, 26, 27, 52].map((indexValue) => (
                <Button
                  key={indexValue}
                  size="small"
                  variant={columnIndexInput === indexValue ? 'contained' : 'outlined'}
                  aria-pressed={columnIndexInput === indexValue}
                  onClick={() => {
                    setColumnIndexInput(indexValue);
                    onRecord(
                      'excel.columnIndex',
                      `${indexValue} -> ${getLettersByIndex(indexValue)}`,
                    );
                  }}
                >
                  {t('컬럼 {{index}} ({{letter}})', {
                    index: indexValue,
                    letter: getLettersByIndex(indexValue),
                  })}
                </Button>
              ))}
            </Stack>
            <div className="integration-result-table">
              <Table size="small" aria-label={t('컬럼 번호 ↔ 열 문자')}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('컬럼 번호')}</TableCell>
                    <TableCell>getLettersByIndex</TableCell>
                    <TableCell>getIndexByLetters</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{columnIndexInput}</TableCell>
                    <TableCell>{convertedLetter}</TableCell>
                    <TableCell>{convertedIndex}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}

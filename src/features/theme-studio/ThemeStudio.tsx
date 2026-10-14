import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Drawer,
  IconButton,
  Snackbar,
  useTheme,
} from '@mui/material';
import { resolveOwpGridTheme } from '@owp/theme';
import { CaretDownIcon, DownloadSimpleIcon, UploadSimpleIcon, XIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ComponentsPreview } from './ComponentsPreview';
import { createPreviewGridTheme, type PreviewThemeSettings } from './model/preview';
import { dataGridThemeSchema, muiThemeSchema } from './model/schemas';
import { createPreviewMuiTheme, editableMuiTheme, exportTheme, importTheme } from './model/studio';
import { PreviewProvider } from './PreviewProvider';
import { ProjectUsage } from './ProjectUsage';
import { ThemeField } from './ThemeField';
import { ComponentColors, GridFields } from './ThemeFields';
import { ThemeSettings } from './ThemeSettings';

export function ThemeStudio({
  open,
  onClose,
  target,
  value,
  onChange,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly target: 'datagrid' | 'components';
  readonly value: PreviewThemeSettings;
  readonly onChange: (next: PreviewThemeSettings) => void;
}) {
  const { t } = useTranslation('app');
  const appMode = useTheme().palette.mode;
  const mode = value.mui?.palette?.mode ?? (value.preset === 'inherit' ? appMode : value.mode);
  const rawGrid = createPreviewGridTheme(value, mode);
  const grid = resolveOwpGridTheme(rawGrid);
  const mui = editableMuiTheme(createPreviewMuiTheme(value, mode, t('행 선택')));
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ message: string; severity: 'success' | 'error' } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const save = () => {
    const url = URL.createObjectURL(
      new Blob([exportTheme(value, mode)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'owp-theme.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const load = async (file: File) => {
    setLoading(true);
    try {
      if (file.size > 256 * 1024) throw new Error('Theme file too large');
      const next = importTheme(await file.text());
      onChange(next);
      setNotice({ message: '테마를 불러왔습니다.', severity: 'success' });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      setNotice({
        message: '테마 파일을 확인해 주세요. OWP 테마 JSON v1을 지원합니다.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  const updateGrid = (group: string, field: string, next: unknown): boolean => {
    const current = Object.entries(rawGrid).find(([key]) => key === group)?.[1];
    const parsed = dataGridThemeSchema.safeParse({
      ...rawGrid,
      [group]: { ...current, [field]: next },
    });
    if (!parsed.success) return false;
    onChange({ ...value, grid: parsed.data });
    return true;
  };
  const updateMui = (group: string, field: string, next: unknown, subgroup?: string): boolean => {
    const current = Object.entries(mui).find(([key]) => key === group)?.[1];
    const nested =
      subgroup && current
        ? Object.entries(current).find(([key]) => key === subgroup)?.[1]
        : undefined;
    const parsed = muiThemeSchema.safeParse({
      ...mui,
      [group]: { ...current, [subgroup ?? field]: subgroup ? { ...nested, [field]: next } : next },
    });
    if (!parsed.success) return false;
    onChange({ ...value, mui: parsed.data });
    return true;
  };
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'theme-studio-title' },
      }}
    >
      <div className="theme-studio">
        <div className="theme-studio-header">
          <div>
            <h2 id="theme-studio-title">{t('테마 편집')}</h2>
            <p>
              {t('{{package}}의 테마를 설정합니다.', {
                package: target === 'datagrid' ? 'OwpDataGrid' : 'OwpComponents',
              })}
            </p>
          </div>
          <IconButton aria-label={t('테마 편집 닫기')} onClick={onClose}>
            <XIcon size={20} />
          </IconButton>
        </div>
        <div className="theme-studio-body">
          {target === 'components' && (
            <PreviewProvider value={value}>
              <ComponentsPreview />
            </PreviewProvider>
          )}
          <ThemeSettings value={value} onChange={onChange} showHeader={target === 'datagrid'} />
          <Accordion disableGutters>
            <AccordionSummary expandIcon={<CaretDownIcon />}>
              <span>{t('글자 크기·모서리')}</span>
            </AccordionSummary>
            <AccordionDetails className="theme-field-grid">
              <ThemeField
                key="font-size"
                label={t('글자 크기')}
                value={target === 'datagrid' ? grid.cell.fontSize : mui.typography.fontSize}
                onCommit={(next) => {
                  if (target !== 'datagrid') return updateMui('typography', 'fontSize', next);
                  const parsed = dataGridThemeSchema.safeParse({
                    ...rawGrid,
                    cell: { ...rawGrid.cell, fontSize: next },
                    header: { ...rawGrid.header, fontSize: next },
                  });
                  if (!parsed.success) return false;
                  onChange({ ...value, grid: parsed.data });
                  return true;
                }}
              />
              <ThemeField
                key="radius"
                label={t(target === 'datagrid' ? '모서리 둥글기 (rem)' : '모서리 둥글기 (px)')}
                value={target === 'datagrid' ? (value.radius ?? 0) : mui.shape.borderRadius}
                onCommit={(next) => {
                  if (target !== 'datagrid') return updateMui('shape', 'borderRadius', next);
                  if (typeof next !== 'number' || !Number.isFinite(next) || next < 0 || next > 2)
                    return false;
                  onChange({ ...value, radius: next });
                  return true;
                }}
              />
            </AccordionDetails>
          </Accordion>
          <ComponentColors
            palette={mui.palette}
            onCommit={(field, next, group) => updateMui('palette', field, next, group)}
          />
          {target === 'datagrid' && <GridFields grid={grid} onCommit={updateGrid} />}
          <ProjectUsage target={target} />
        </div>
        <div className="theme-studio-actions">
          <Button startIcon={<DownloadSimpleIcon size={16} />} onClick={save}>
            {t('파일 저장')}
          </Button>
          <Button
            startIcon={<UploadSimpleIcon size={16} />}
            disabled={loading}
            onClick={() => fileInput.current?.click()}
          >
            {t('파일 불러오기')}
          </Button>
          <input
            ref={fileInput}
            hidden
            type="file"
            accept=".json,application/json"
            aria-label={t('테마 파일')}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void load(file);
            }}
          />
        </div>
        <Snackbar
          open={Boolean(notice)}
          autoHideDuration={5000}
          onClose={(_, reason) => {
            if (reason !== 'clickaway') setNotice(null);
          }}
        >
          <Alert severity={notice?.severity ?? 'success'} onClose={() => setNotice(null)}>
            {notice ? t(notice.message) : ''}
          </Alert>
        </Snackbar>
      </div>
    </Drawer>
  );
}

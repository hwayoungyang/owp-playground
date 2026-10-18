import { useOwpTranslation } from '@owp/components/hooks';
import {
  Button,
  Drawer,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Switch,
} from '@mui/material';
import type { OwpDataGridRowSelectionMode } from '@owp/datagrid/types';
import { XIcon } from '@phosphor-icons/react';
import { z } from 'zod';
import type { PreviewThemeSettings } from '../../../features/theme-studio/model/preview';
import { ThemeSettings } from '../../../features/theme-studio/ThemeSettings';

export type GridViewSettings = {
  readonly selection: OwpDataGridRowSelectionMode;
  readonly filter: boolean;
  readonly compact: boolean;
  readonly radius: number;
};
const selectionSchema = z.enum(['none', 'single', 'multiple']);

export function GridSettingsDrawer({
  open,
  onClose,
  value,
  onChange,
  theme,
  onThemeChange,
  onThemeOpen,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly value: GridViewSettings;
  readonly onChange: (value: GridViewSettings) => void;
  readonly theme: PreviewThemeSettings;
  readonly onThemeChange: (value: PreviewThemeSettings) => void;
  readonly onThemeOpen: () => void;
}) {
  const { t } = useOwpTranslation();
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div className="grid-settings-panel">
        <div className="grid-settings-heading">
          <h2>{t('설정')}</h2>
          <IconButton aria-label={t('설정 닫기')} onClick={onClose}>
            <XIcon size={20} />
          </IconButton>
        </div>
        <p>{t('선택·필터·화면 설정을 바꿀 수 있습니다.')}</p>
        <div className="grid-settings-field">
          <label htmlFor="selection-mode">{t('행 선택 방식')}</label>
          <Select
            value={value.selection}
            id="selection-mode"
            onChange={(event) => {
              const result = selectionSchema.safeParse(event.target.value);
              if (result.success) onChange({ ...value, selection: result.data });
            }}
            inputProps={{ 'aria-label': t('행 선택 방식') }}
          >
            <MenuItem value="none">{t('선택 없음')}</MenuItem>
            <MenuItem value="single">{t('단일 선택')}</MenuItem>
            <MenuItem value="multiple">{t('다중 선택')}</MenuItem>
          </Select>
        </div>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={value.filter}
              onChange={(_, checked) => onChange({ ...value, filter: checked })}
            />
          }
          label={t('컬럼 필터 표시')}
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={value.compact}
              onChange={(_, checked) => onChange({ ...value, compact: checked })}
            />
          }
          label={t('행 높이 줄이기')}
        />
        <div className="grid-settings-field">
          <label htmlFor="radius-size">{t('모서리 둥글기')}</label>
          <Select
            id="radius-size"
            value={value.radius}
            inputProps={{ 'aria-label': t('모서리 둥글기') }}
            onChange={(event) => {
              const radius = Number(event.target.value);
              if ([0, 0.25, 0.5, 0.75].includes(radius)) onChange({ ...value, radius });
            }}
          >
            <MenuItem value={0}>{t('기본 (각진)')}</MenuItem>
            <MenuItem value={0.25}>{t('작게')}</MenuItem>
            <MenuItem value={0.5}>{t('중간')}</MenuItem>
            <MenuItem value={0.75}>{t('크게')}</MenuItem>
            {![0, 0.25, 0.5, 0.75].includes(value.radius) && (
              <MenuItem value={value.radius}>{value.radius} rem</MenuItem>
            )}
          </Select>
        </div>
        <ThemeSettings value={theme} onChange={onThemeChange} />
        <Button onClick={onThemeOpen}>{t('상세 테마 편집')}</Button>
        <div className="grid-settings-note">
          {t('초기화하면 데이터와 그리드 설정을 되돌립니다.')}
        </div>
        <Button variant="outlined" onClick={onClose}>
          {t('닫기')}
        </Button>
      </div>
    </Drawer>
  );
}

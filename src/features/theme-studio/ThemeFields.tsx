import { useOwpTranslation } from '@owp/components/hooks';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControlLabel,
  Switch,
} from '@mui/material';
import type { resolveOwpGridTheme } from '@owp/theme';
import { CaretDownIcon } from '@phosphor-icons/react';
import type { editableMuiTheme } from './model/studio';
import {
  muiColorLabels,
  muiPaletteLabels,
  themeFieldLabels,
  themeGroupLabels,
} from './model/studioLabels';
import type { ThemeFieldCommitResult } from './model/validation';
import { ThemeField } from './ThemeField';

export function ComponentColors({
  palette,
  onCommit,
}: {
  readonly palette: ReturnType<typeof editableMuiTheme>['palette'];
  readonly onCommit: (field: string, value: unknown, group?: string) => ThemeFieldCommitResult;
}) {
  const { t } = useOwpTranslation();
  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<CaretDownIcon />}>
        <span>{t('컴포넌트 색상')}</span>
      </AccordionSummary>
      <AccordionDetails className="theme-field-grid">
        {Object.entries(palette).flatMap(([key, fields]) =>
          typeof fields === 'object'
            ? Object.entries(fields).map(([field, color]) => (
                <ThemeField
                  key={`${key}.${field}`}
                  label={`${t(muiPaletteLabels[key] ?? '색상')} · ${t(muiColorLabels[field] ?? '색상')}`}
                  value={color}
                  onCommit={(next) => onCommit(field, next, key)}
                />
              ))
            : key === 'divider'
              ? [
                  <ThemeField
                    key="divider"
                    label={t('구분선 색상')}
                    value={fields}
                    onCommit={(next) => onCommit('divider', next)}
                  />,
                ]
              : [],
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export function GridFields({
  grid,
  onCommit,
}: {
  readonly grid: ReturnType<typeof resolveOwpGridTheme>;
  readonly onCommit: (group: string, field: string, value: unknown) => ThemeFieldCommitResult;
}) {
  const { t } = useOwpTranslation();
  return (
    <div className="theme-grid-fields">
      <h3>{t('그리드 세부 설정')}</h3>
      {Object.entries(grid).map(([group, fields]) => (
        <Accordion key={group} disableGutters>
          <AccordionSummary expandIcon={<CaretDownIcon />}>
            <span>{t(themeGroupLabels[group] ?? '그리드', { context: 'theme' })}</span>
          </AccordionSummary>
          <AccordionDetails className="theme-field-grid">
            {Object.entries(fields)
              .filter(
                ([field]) =>
                  field !== 'focusedRowBorderColor' &&
                  !(
                    group === 'state' &&
                    ['hoverBackgroundColor', 'hoverBorderColor'].includes(field)
                  ),
              )
              .map(([field, current]) =>
                typeof current === 'boolean' ? (
                  <FormControlLabel
                    key={field}
                    label={`${t(themeGroupLabels[group] ?? '그리드', { context: 'theme' })} · ${t(themeFieldLabels[field] ?? '설정')}`}
                    control={
                      <Switch
                        checked={current}
                        onChange={(_, next) => onCommit(group, field, next)}
                      />
                    }
                  />
                ) : (
                  <ThemeField
                    key={field}
                    label={`${t(themeGroupLabels[group] ?? '그리드', { context: 'theme' })} · ${t(themeFieldLabels[field] ?? '설정')}`}
                    value={current}
                    onCommit={(next) => onCommit(group, field, next)}
                  />
                ),
              )}
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
}

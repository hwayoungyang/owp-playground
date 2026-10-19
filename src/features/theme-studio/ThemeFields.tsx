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

function paletteFields(
  value: unknown,
  path: readonly string[] = [],
): readonly { readonly path: readonly string[]; readonly value: string }[] {
  if (path[0] === 'mode') return [];
  if (typeof value === 'string') return [{ path, value }];
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, field]) => paletteFields(field, [...path, key]));
}

export function ComponentColors({
  palette,
  onCommit,
}: {
  readonly palette: ReturnType<typeof editableMuiTheme>['palette'];
  readonly onCommit: (path: readonly string[], value: unknown) => ThemeFieldCommitResult;
}) {
  const { t } = useOwpTranslation();
  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<CaretDownIcon />}>
        <span>{t('컴포넌트 색상')}</span>
      </AccordionSummary>
      <AccordionDetails className="theme-field-grid">
        {paletteFields(palette).map(({ path, value }) => (
          <ThemeField
            key={path.join('.')}
            label={
              path[0] === 'divider'
                ? t('구분선 색상')
                : path
                    .map((field, index) =>
                      t(
                        (index === path.length - 1 ? muiColorLabels : muiPaletteLabels)[field] ??
                          '색상',
                      ),
                    )
                    .join(' · ')
            }
            value={value}
            onCommit={(next) => onCommit(path, next)}
          />
        ))}
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

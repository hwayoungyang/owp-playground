import { useOwpTranslation } from '@owp/components/hooks';
import {
  changeThemeMode,
  defaultTheme,
  defaultThemeOptions,
  defaultThemes,
  extendThemeWithMixins,
  getThemeWithButtonPaletteDefaults,
  mustHaveThemeOptions,
  OwpThemeProvider,
} from '@owp/theme';
import { owpDark, skyBlue } from '@owp/theme/colors';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  getContrastRatio,
} from '@mui/material';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

const primaryPresets = [
  { id: 'skyBlue', label: '스카이 블루', main: skyBlue[600] },
  { id: 'owpDark', label: '다크 그레이', main: owpDark[500] },
  { id: 'emerald', label: '에메랄드', main: '#0d9488' },
  { id: 'indigo', label: '인디고', main: '#4f46e5' },
] as const;

const radiusOptions = [4, 8, 14] as const;

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const hostTheme = useTheme();
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [primaryId, setPrimaryId] = useState<(typeof primaryPresets)[number]['id']>('skyBlue');
  const [borderRadius, setBorderRadius] = useState<(typeof radiusOptions)[number]>(8);
  const [sampleInput, setSampleInput] = useState('OWP Playground');

  const selectedPrimary =
    primaryPresets.find((preset) => preset.id === primaryId) ?? primaryPresets[0];
  const contrastText =
    getContrastRatio(selectedPrimary.main, '#ffffff') >= 4.5 ? '#ffffff' : '#0f172a';

  const resolvedOwpTheme = useMemo(() => {
    const withButtonDefaults = getThemeWithButtonPaletteDefaults({
      palette: {
        ...defaultTheme.palette,
        primary: {
          main: selectedPrimary.main,
          contrastText: contrastText,
        },
        secondary: defaultThemes.default.palette.secondary,
      },
    });
    return changeThemeMode(withButtonDefaults, mode);
  }, [mode, selectedPrimary, contrastText]);

  const previewMuiTheme = useMemo(() => {
    const paletteMode = resolvedOwpTheme.palette.mode === 'dark' ? 'dark' : 'light';
    return createTheme({
      palette: {
        mode: paletteMode,
        primary: {
          main: selectedPrimary.main,
          contrastText: contrastText,
        },
        secondary: defaultThemes.default.palette.secondary,
        background: {
          paper:
            resolvedOwpTheme.palette.background?.paper ??
            (paletteMode === 'dark' ? '#1E2125' : '#FFFFFF'),
          default:
            resolvedOwpTheme.palette.background?.default ??
            (paletteMode === 'dark' ? '#121212' : '#F7F7F7'),
        },
        text: resolvedOwpTheme.palette.text,
        divider: resolvedOwpTheme.palette.divider,
      },
      shape: {
        borderRadius,
      },
      typography: {
        ...hostTheme.typography,
      },
    });
  }, [resolvedOwpTheme, selectedPrimary, contrastText, borderRadius, hostTheme.typography]);

  const borderMixinSample = useMemo(
    () =>
      extendThemeWithMixins({
        palette: {
          mode,
          divider: resolvedOwpTheme.palette.divider,
        },
      }).border(1),
    [mode, resolvedOwpTheme.palette.divider],
  );

  useEffect(() => {
    onData({
      mode,
      primaryId,
      primaryMain: selectedPrimary.main,
      borderRadius,
      sampleInput,
      backgroundPaper: previewMuiTheme.palette.background.paper,
      textPrimary: previewMuiTheme.palette.text.primary,
      borderMixinSample,
      defaultFontFamily: defaultThemeOptions.typography.fontFamily,
      mustHaveHtmlFontSize: mustHaveThemeOptions.typography.htmlFontSize,
    });
  }, [
    mode,
    primaryId,
    selectedPrimary.main,
    borderRadius,
    sampleInput,
    previewMuiTheme,
    borderMixinSample,
    onData,
  ]);

  return (
    <>
      <section
        className="components-example-section"
        aria-label={t('모드·Primary·Radius 로컬 테마 프리뷰')}
      >
        <div className="components-example-content">
          <div className="integration-demo-controls">
            <ToggleButtonGroup
              className="integration-choice"
              size="small"
              exclusive
              value={mode}
              aria-label={t('테마 모드')}
              onChange={(_, next: 'light' | 'dark' | null) => {
                if (!next) return;
                setMode(next);
                onRecord('theme.mode', next);
              }}
            >
              <ToggleButton value="light">Light</ToggleButton>
              <ToggleButton value="dark">Dark</ToggleButton>
            </ToggleButtonGroup>
            <FormControl className="integration-demo-select" size="small">
              <InputLabel id="theme-radius-label">radius</InputLabel>
              <Select
                labelId="theme-radius-label"
                label="radius"
                value={borderRadius}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (next !== 4 && next !== 8 && next !== 14) return;
                  setBorderRadius(next);
                  onRecord('theme.radius', `${next}px`);
                }}
              >
                {radiusOptions.map((radius) => (
                  <MenuItem key={radius} value={radius}>
                    {radius}px
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl className="integration-demo-select" size="small">
              <InputLabel id="theme-color-label">{t('색상')}</InputLabel>
              <Select
                labelId="theme-color-label"
                label={t('색상')}
                value={primaryId}
                onChange={(event) => {
                  const next = primaryPresets.find((preset) => preset.id === event.target.value);
                  if (!next) return;
                  setPrimaryId(next.id);
                  onRecord('theme.primary', next.main);
                }}
              >
                {primaryPresets.map((preset) => (
                  <MenuItem key={preset.id} value={preset.id}>
                    {t(preset.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <ThemeProvider theme={previewMuiTheme}>
            <OwpThemeProvider
              datePicker={{
                selectedBackground: selectedPrimary.main,
                selectedColor: contrastText,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: `${borderRadius}px`,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  ...borderMixinSample,
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {t('미리보기')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('앱 전체 테마를 바꾸지 않고 하위 영역에만 테마 옵션을 적용합니다.')}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: `${borderRadius}px`,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {mode.toUpperCase()} · {selectedPrimary.main} · {borderRadius}px
                    </Box>
                  </Stack>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{ alignItems: 'flex-start' }}
                  >
                    <TextField
                      size="small"
                      label={t('프리뷰 입력 필드')}
                      value={sampleInput}
                      onChange={(event) => setSampleInput(event.target.value)}
                      sx={{
                        width: 240,
                        maxWidth: '100%',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: `${borderRadius}px`,
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ borderRadius: `${borderRadius}px` }}
                      onClick={() =>
                        onRecord('theme.previewAction', `${mode}:${selectedPrimary.main}`)
                      }
                    >
                      {t('확인')}
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      sx={{ borderRadius: `${borderRadius}px` }}
                      onClick={() => onRecord('theme.previewCancel', mode)}
                    >
                      {t('취소')}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </OwpThemeProvider>
          </ThemeProvider>
          <DemoResultTable
            label={t('테마 설정 결과')}
            rows={[
              { label: t('모드'), value: mode },
              {
                label: 'primary',
                value: selectedPrimary.main,
              },
              { label: 'radius', value: `${borderRadius}px` },
            ]}
          />
        </div>
      </section>
    </>
  );
}

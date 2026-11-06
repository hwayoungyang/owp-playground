import { useOwpTranslation } from '@owp/components/hooks';
import { generateBarcodeBlob, generateBarcodeDataUrl } from '@owp/utils/barcode';
import {
  Alert,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

const formatPresets = [
  { id: 'CODE128', label: 'CODE128', defaultText: 'OWP-2026-0001' },
  { id: 'CODE39', label: 'CODE39', defaultText: 'OWP-2026-0001' },
  { id: 'EAN13', label: 'EAN13', defaultText: '1234567890128' },
] as const;

type BarcodeFormat = (typeof formatPresets)[number]['id'];

const heightOptions = [48, 80, 120] as const;

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const mountedRef = useRef(true);
  const [generation, setGeneration] = useState(0);
  const [barcodeText, setBarcodeText] = useState('OWP-2026-0001');
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [height, setHeight] = useState<(typeof heightOptions)[number]>(80);
  const [displayValue, setDisplayValue] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [barcodeResult, setBarcodeResult] = useState<{
    readonly dataUrl: string;
    readonly blobSize: number;
    readonly blobType: string;
    readonly payload: string;
    readonly format: string;
    readonly height: number;
    readonly displayValue: boolean;
  } | null>(null);

  const currentBarcodeResult =
    !busy &&
    barcodeResult?.payload === barcodeText.trim() &&
    barcodeResult.format === format &&
    barcodeResult.height === height &&
    barcodeResult.displayValue === displayValue
      ? barcodeResult
      : null;

  const recordEvent = useEffectEvent((name: string, detail: string) => {
    onRecord(name, detail);
  });

  const reportGenerationError = useEffectEvent((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : t('바코드 이미지를 생성하지 못했습니다. 형식이 올바른지 확인해 주세요.');
    setErrorMessage(message);
    onRecord('barcode.error', message);
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function handleFormatChange(nextFormat: BarcodeFormat) {
    setFormat(nextFormat);
    setErrorMessage(null);
    const currentPreset = formatPresets.find((item) => item.id === format);
    const nextPreset = formatPresets.find((item) => item.id === nextFormat);
    if (
      nextPreset &&
      (!barcodeText.trim() || (currentPreset && barcodeText.trim() === currentPreset.defaultText))
    ) {
      setBarcodeText(nextPreset.defaultText);
    }
  }

  function requestManualGeneration(targetText: string) {
    const trimmed = targetText.trim();
    if (!trimmed) {
      setErrorMessage(t('바코드로 변환할 텍스트를 입력해 주세요.'));
      onRecord('barcode.error', 'Empty barcode text');
      return;
    }
    setBarcodeText(trimmed);
    setGeneration((value) => value + 1);
  }

  function handleRetry() {
    const preset = formatPresets.find((item) => item.id === format);
    const nextText = barcodeText.trim() || preset?.defaultText || 'OWP-2026-0001';
    setBarcodeText(nextText);
    setGeneration((value) => value + 1);
  }

  useEffect(() => {
    let cancelled = false;
    const trimmed = barcodeText.trim();
    if (!trimmed) {
      setBusy(false);
      setBarcodeResult(null);
      return;
    }

    setBusy(true);
    setBarcodeResult(null);
    setErrorMessage(null);

    const options = {
      format,
      height,
      displayValue,
      lineColor: '#000000',
      background: '#ffffff',
      margin: 10,
    };

    void Promise.all([
      generateBarcodeDataUrl(trimmed, options),
      generateBarcodeBlob(trimmed, options),
    ])
      .then(([dataUrl, blob]) => {
        if (cancelled || !mountedRef.current) return;
        setBarcodeResult({
          dataUrl,
          blobSize: blob.size,
          blobType: blob.type,
          payload: trimmed,
          format,
          height,
          displayValue,
        });
        recordEvent(
          'barcode.render',
          `${trimmed} (${format}, ${height}px, text: ${displayValue ? 'on' : 'off'})`,
        );
      })
      .catch((error: unknown) => {
        if (cancelled || !mountedRef.current) return;
        setBarcodeResult(null);
        reportGenerationError(error);
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) {
          setBusy(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [barcodeText, format, height, displayValue, generation]);

  useEffect(() => {
    onData({
      barcodeText,
      format,
      height,
      displayValue,
      busy,
      errorMessage,
      dataUrlLength: currentBarcodeResult?.dataUrl.length ?? null,
      blobSize: currentBarcodeResult?.blobSize ?? null,
      blobType: currentBarcodeResult?.blobType ?? null,
    });
  }, [barcodeText, format, height, displayValue, busy, errorMessage, currentBarcodeResult, onData]);

  return (
    <section className="integration-demo" aria-label={t('바코드 생성')}>
      <div className="integration-demo-controls">
        <ToggleButtonGroup
          className="integration-choice"
          size="small"
          exclusive
          value={format}
          disabled={busy}
          aria-label={t('바코드 형식')}
          onChange={(_, next: string | null) => {
            const preset = formatPresets.find((item) => item.id === next);
            if (preset) handleFormatChange(preset.id);
          }}
        >
          {formatPresets.map((preset) => (
            <ToggleButton key={preset.id} value={preset.id}>
              {preset.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <FormControl size="small" className="integration-demo-select">
          <InputLabel id="barcode-height-label">{t('높이')}</InputLabel>
          <Select
            labelId="barcode-height-label"
            label={t('높이')}
            value={height}
            disabled={busy}
            onChange={(event) => {
              const next = heightOptions.find((option) => option === Number(event.target.value));
              if (next !== undefined) setHeight(next);
            }}
          >
            {heightOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}px
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          label={t('텍스트 표시')}
          control={
            <Switch
              size="small"
              checked={displayValue}
              disabled={busy}
              onChange={(_, checked) => setDisplayValue(checked)}
            />
          }
        />
      </div>
      <div className="integration-demo-stage">
        <Stack spacing={2} sx={{ maxWidth: 320 }}>
          <TextField
            size="small"
            fullWidth
            label={t('바코드 데이터')}
            value={barcodeText}
            disabled={busy}
            onChange={(event) => {
              setBarcodeText(event.target.value);
              setErrorMessage(null);
            }}
          />
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="text"
              loading={busy}
              disabled={busy}
              onClick={() => requestManualGeneration(barcodeText)}
            >
              {t('바코드 생성')}
            </Button>
            {currentBarcodeResult && (
              <Button
                size="small"
                variant="contained"
                component="a"
                href={currentBarcodeResult.dataUrl}
                download="owp-barcode.png"
                onClick={() => onRecord('barcode.download', currentBarcodeResult.payload)}
              >
                {t('PNG 다운로드')}
              </Button>
            )}
          </Stack>
          {errorMessage && (
            <Alert
              severity="error"
              action={
                <Button size="small" color="inherit" disabled={busy} onClick={handleRetry}>
                  {t('다시 시도')}
                </Button>
              }
            >
              {errorMessage}
            </Alert>
          )}
        </Stack>
        {currentBarcodeResult ? (
          <div className="integration-demo-media" style={{ minHeight: height + 36 }}>
            <img src={currentBarcodeResult.dataUrl} alt={t('생성된 바코드 이미지')} />
          </div>
        ) : (
          <Typography variant="body2" color="text.secondary" role="status">
            {t(busy ? '바코드를 생성하고 있습니다.' : '바코드 데이터를 입력해 주세요.')}
          </Typography>
        )}
      </div>
      <DemoResultTable
        label={t('바코드 생성 결과')}
        rows={[
          {
            label: t('데이터'),
            value: currentBarcodeResult?.payload ?? '—',
          },
          { label: t('형식'), value: currentBarcodeResult?.format ?? '—' },
          {
            label: t('높이'),
            value: currentBarcodeResult ? `${currentBarcodeResult.height}px` : '—',
          },
          {
            label: t('텍스트 표시'),
            value: currentBarcodeResult
              ? currentBarcodeResult.displayValue
                ? t('표시함')
                : t('표시 안 함')
              : '—',
          },
          {
            label: t('파일 크기'),
            value: currentBarcodeResult
              ? `${currentBarcodeResult.blobSize.toLocaleString()} bytes`
              : '—',
          },
        ]}
      />
    </section>
  );
}

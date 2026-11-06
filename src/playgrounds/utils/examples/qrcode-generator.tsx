import { useOwpTranslation } from '@owp/components/hooks';
import { generateQrCodeDataUrl, type QrCodeErrorCorrectionLevel } from '@owp/utils/qrcode';
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

const colorThemes = {
  slate: { label: '슬레이트', dark: '#0f172a', light: '#ffffff' },
  ocean: { label: '오션 블루', dark: '#0369a1', light: '#f0f9ff' },
  emerald: { label: '에메랄드', dark: '#065f46', light: '#ecfdf5' },
} as const;

const errorCorrectionLevels: readonly QrCodeErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];
const widthOptions = [160, 200, 240] as const;

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const mountedRef = useRef(true);
  const [generation, setGeneration] = useState(0);
  const [payloadText, setPayloadText] = useState('https://owp.impix.co.kr/asset/LINE-A100');
  const [width, setWidth] = useState<(typeof widthOptions)[number]>(200);
  const [margin, setMargin] = useState<1 | 2 | 4>(2);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<QrCodeErrorCorrectionLevel>('H');
  const [colorKey, setColorKey] = useState<keyof typeof colorThemes>('slate');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrResult, setQrResult] = useState<{
    readonly dataUrl: string;
    readonly quickUrlLength: number;
    readonly payload: string;
    readonly width: number;
    readonly margin: number;
    readonly errorCorrectionLevel: QrCodeErrorCorrectionLevel;
    readonly colorKey: keyof typeof colorThemes;
  } | null>(null);

  const recordEvent = useEffectEvent((name: string, detail: string) => {
    onRecord(name, detail);
  });
  const reportGenerationError = useEffectEvent((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : t('QR 코드 이미지를 생성하지 못했습니다. 다시 시도해 주세요.');
    setErrorMessage(message);
    onRecord('qrcode.error', message);
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const currentColors = colorThemes[colorKey];
  const currentQrResult =
    !busy &&
    qrResult?.payload === payloadText.trim() &&
    qrResult.width === width &&
    qrResult.margin === margin &&
    qrResult.errorCorrectionLevel === errorCorrectionLevel &&
    qrResult.colorKey === colorKey
      ? qrResult
      : null;

  function requestGeneration(targetText: string) {
    const trimmed = targetText.trim();
    if (!trimmed) {
      setErrorMessage(t('QR 코드로 변환할 텍스트를 입력해 주세요.'));
      onRecord('qrcode.error', 'Empty QR text');
      return;
    }
    setPayloadText(trimmed);
    setGeneration((value) => value + 1);
  }

  useEffect(() => {
    let cancelled = false;
    const trimmed = payloadText.trim();
    if (!trimmed) {
      setBusy(false);
      setQrResult(null);
      return;
    }
    setBusy(true);
    setQrResult(null);
    setErrorMessage(null);
    void Promise.all([
      generateQrCodeDataUrl(trimmed, {
        width,
        margin,
        errorCorrectionLevel,
        color: {
          dark: colorThemes[colorKey].dark,
          light: colorThemes[colorKey].light,
        },
      }),
      generateQrCodeDataUrl(trimmed, { width }),
    ])
      .then(([dataUrl, quickUrl]) => {
        if (cancelled || !mountedRef.current) return;
        setQrResult({
          dataUrl,
          quickUrlLength: quickUrl.length,
          payload: trimmed,
          width,
          margin,
          errorCorrectionLevel,
          colorKey,
        });
        recordEvent('qrcode.render', `${trimmed} (${width}px, ${errorCorrectionLevel})`);
      })
      .catch((error: unknown) => {
        if (cancelled || !mountedRef.current) return;
        setQrResult(null);
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
  }, [payloadText, width, margin, errorCorrectionLevel, colorKey, generation]);

  useEffect(() => {
    onData({
      payloadText,
      width,
      margin,
      errorCorrectionLevel,
      colorKey,
      busy,
      errorMessage,
      dataUrlLength: currentQrResult?.dataUrl.length ?? null,
      quickUrlLength: currentQrResult?.quickUrlLength ?? null,
    });
  }, [
    payloadText,
    width,
    margin,
    errorCorrectionLevel,
    colorKey,
    busy,
    errorMessage,
    currentQrResult,
    onData,
  ]);

  return (
    <section className="integration-demo" aria-label={t('QR 코드 이미지 Data URL 생성')}>
      <div className="integration-demo-toolbar">
        <div className="integration-demo-controls">
          <FormControl size="small" className="integration-demo-select" sx={{ minWidth: 120 }}>
            <InputLabel id="qr-size-label">{t('QR 크기')}</InputLabel>
            <Select
              labelId="qr-size-label"
              id="qr-size-select"
              value={width}
              label={t('QR 크기')}
              disabled={busy}
              onChange={(e) => setWidth(Number(e.target.value) as (typeof widthOptions)[number])}
            >
              {widthOptions.map((sizeOption) => (
                <MenuItem key={sizeOption} value={sizeOption}>
                  {sizeOption}px
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="integration-demo-select" sx={{ minWidth: 130 }}>
            <InputLabel id="qr-color-label">{t('색상 테마')}</InputLabel>
            <Select
              labelId="qr-color-label"
              id="qr-color-select"
              value={colorKey}
              label={t('색상 테마')}
              disabled={busy}
              onChange={(e) => setColorKey(e.target.value as keyof typeof colorThemes)}
            >
              {(Object.keys(colorThemes) as Array<keyof typeof colorThemes>).map((key) => (
                <MenuItem key={key} value={key}>
                  {t(colorThemes[key].label)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <div className="integration-demo-stage">
        <Stack spacing={2} sx={{ width: '100%', maxWidth: { sm: 320 }, minWidth: 0 }}>
          <TextField
            size="small"
            fullWidth
            label={t('QR 코드 텍스트·URL')}
            value={payloadText}
            disabled={busy}
            onChange={(event) => {
              setPayloadText(event.target.value);
              setErrorMessage(null);
            }}
          />

          <details className="integration-demo-details">
            <summary>{t('추가 옵션')}</summary>
            <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, flexWrap: 'wrap' }} useFlexGap>
              <FormControl size="small" className="integration-demo-select" sx={{ minWidth: 110 }}>
                <InputLabel id="qr-margin-label">{t('여백')}</InputLabel>
                <Select
                  labelId="qr-margin-label"
                  id="qr-margin-select"
                  value={margin}
                  label={t('여백')}
                  disabled={busy}
                  onChange={(e) => setMargin(Number(e.target.value) as 1 | 2 | 4)}
                >
                  {([1, 2, 4] as const).map((marginOption) => (
                    <MenuItem key={marginOption} value={marginOption}>
                      {t('여백 {{margin}}', { margin: marginOption })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" className="integration-demo-select" sx={{ minWidth: 130 }}>
                <InputLabel id="qr-ec-label">{t('정정 수준')}</InputLabel>
                <Select
                  labelId="qr-ec-label"
                  id="qr-ec-select"
                  value={errorCorrectionLevel}
                  label={t('정정 수준')}
                  disabled={busy}
                  onChange={(e) =>
                    setErrorCorrectionLevel(e.target.value as QrCodeErrorCorrectionLevel)
                  }
                >
                  {errorCorrectionLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {t('정정 수준 {{level}}', { level })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </details>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <Button
              size="small"
              variant="text"
              color="inherit"
              loading={busy}
              disabled={busy}
              onClick={() => requestGeneration(payloadText)}
            >
              {t('QR 코드 생성')}
            </Button>
            {currentQrResult && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                component="a"
                href={currentQrResult.dataUrl}
                download="owp-qrcode.png"
                onClick={() => onRecord('qrcode.download', currentQrResult.payload)}
              >
                {t('PNG 다운로드')}
              </Button>
            )}
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
                    const nextText =
                      payloadText.trim() || 'https://owp.impix.co.kr/asset/LINE-A100';
                    requestGeneration(nextText);
                  }}
                >
                  {t('다시 시도')}
                </Button>
              }
            >
              {errorMessage}
            </Alert>
          )}
        </Stack>

        {currentQrResult ? (
          <div
            className="integration-demo-media"
            style={{ minHeight: width + 48, backgroundColor: currentColors.light }}
          >
            <img
              src={currentQrResult.dataUrl}
              alt={t('생성된 QR 코드 이미지')}
              width={currentQrResult.width}
              height={currentQrResult.width}
            />
          </div>
        ) : (
          <Typography variant="body2" color="text.secondary" role="status">
            {t(busy ? 'QR 코드를 생성하고 있습니다.' : 'QR 코드 텍스트를 입력해 주세요.')}
          </Typography>
        )}
      </div>
      <DemoResultTable
        label={t('QR 코드 생성 결과')}
        rows={[
          { label: t('데이터'), value: currentQrResult?.payload ?? '—' },
          { label: t('크기'), value: currentQrResult ? `${currentQrResult.width}px` : '—' },
          { label: t('여백'), value: currentQrResult?.margin ?? '—' },
          { label: t('정정 수준'), value: currentQrResult?.errorCorrectionLevel ?? '—' },
          {
            label: t('색상'),
            value: currentQrResult
              ? `${colorThemes[currentQrResult.colorKey].dark} / ${colorThemes[currentQrResult.colorKey].light}`
              : '—',
          },
        ]}
      />
    </section>
  );
}

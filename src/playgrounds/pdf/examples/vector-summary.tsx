import { useOwpTranslation } from '@owp/components/hooks';
import {
  Document,
  Line,
  OwpPdfPage,
  Rect,
  renderPdfToBlob,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@owp/pdf';
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

const reportPresets = {
  q3: {
    label: '3분기',
    period: '2026-Q3',
    metrics: [
      { name: 'Availability', score: 96, color: '#0284c7' },
      { name: 'Performance', score: 89, color: '#0d9488' },
      { name: 'Quality Yield', score: 98, color: '#4f46e5' },
    ],
  },
  q4: {
    label: '4분기',
    period: '2026-Q4',
    metrics: [
      { name: 'Availability', score: 99, color: '#0284c7' },
      { name: 'Performance', score: 94, color: '#0d9488' },
      { name: 'Quality Yield', score: 99, color: '#4f46e5' },
    ],
  },
} as const;

const vectorStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 32,
    color: '#0f172a',
  },
  heading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    marginBottom: 14,
  },
  metricBlock: {
    marginBottom: 14,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});

function createVectorReportDocument(presetKey: keyof typeof reportPresets) {
  const preset = reportPresets[presetKey];
  return (
    <Document title={`OWP KPI ${preset.period}`}>
      <OwpPdfPage size="A4" style={vectorStyles.page}>
        <Text style={vectorStyles.heading}>OWP Vector KPI Summary ({preset.period})</Text>
        {preset.metrics.map((metric) => {
          const barWidth = Math.round((metric.score / 100) * 240);
          return (
            <View key={metric.name} style={vectorStyles.metricBlock}>
              <View style={vectorStyles.metricLabelRow}>
                <Text>{metric.name}</Text>
                <Text>{metric.score}%</Text>
              </View>
              <Svg width={240} height={18}>
                <Rect x={0} y={2} width={240} height={10} fill="#e2e8f0" />
                <Rect x={0} y={2} width={barWidth} height={10} fill={metric.color} />
                <Line x1={0} y1={16} x2={240} y2={16} stroke="#cbd5e1" strokeWidth={1} />
              </Svg>
            </View>
          );
        })}
      </OwpPdfPage>
    </Document>
  );
}

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const mountedRef = useRef(true);
  const pendingRef = useRef(false);
  const blobUrlRef = useRef<string | null>(null);
  const [presetKey, setPresetKey] = useState<keyof typeof reportPresets>('q4');
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<1 | 2>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renderedReport, setRenderedReport] = useState<{
    readonly period: string;
    readonly size: number;
    readonly url: string;
  } | null>(null);

  function revokeUrl() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      revokeUrl();
    };
  }, []);

  const currentPreset = reportPresets[presetKey];

  useEffect(() => {
    onData({
      presetKey,
      period: currentPreset.period,
      metrics: currentPreset.metrics,
      busy,
      zoom,
      errorMessage,
      renderedSize: renderedReport?.size ?? null,
      hasObjectUrl: Boolean(renderedReport?.url),
    });
  }, [presetKey, currentPreset, busy, zoom, errorMessage, renderedReport, onData]);

  async function generateVectorPdf() {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setBusy(true);
    setErrorMessage(null);
    onRecord('pdf.vector.start', currentPreset.period);
    try {
      const blob = await renderPdfToBlob(createVectorReportDocument(presetKey));
      if (!mountedRef.current) return;
      revokeUrl();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setRenderedReport({
        period: currentPreset.period,
        size: blob.size,
        url,
      });
      onRecord('pdf.vector.success', `${currentPreset.period} (${blob.size} bytes)`);
    } catch (error) {
      if (!mountedRef.current) return;
      const message =
        error instanceof Error
          ? error.message
          : t('SVG 리포트 PDF를 생성하지 못했습니다. 다시 시도해 주세요.');
      setErrorMessage(message);
      onRecord('pdf.vector.error', message);
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  return (
    <section
      className="components-example-section"
      aria-label={t('SVG 막대 도형이 포함된 KPI PDF 리포트')}
    >
      <div className="components-example-content">
        <ToggleButtonGroup
          className="integration-choice"
          size="small"
          exclusive
          value={presetKey}
          disabled={busy}
          aria-label={t('리포트 지표')}
          onChange={(_, next: keyof typeof reportPresets | null) => {
            if (!next) return;
            setPresetKey(next);
            setErrorMessage(null);
            setRenderedReport(null);
            revokeUrl();
            onRecord('pdf.vector.preset', reportPresets[next].period);
          }}
        >
          {(Object.keys(reportPresets) as Array<keyof typeof reportPresets>).map((key) => (
            <ToggleButton key={key} value={key}>
              {t(reportPresets[key].label)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Typography variant="body2">{t('SVG 미리보기')}</Typography>
          <ToggleButtonGroup
            className="integration-choice"
            size="small"
            exclusive
            value={zoom}
            aria-label={t('확대 비율')}
            onChange={(_, next: 1 | 2 | null) => {
              if (!next) return;
              setZoom(next);
              onRecord('pdf.vector.zoom', `${next * 100}%`);
            }}
          >
            <ToggleButton value={1}>100%</ToggleButton>
            <ToggleButton value={2}>200%</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Box
          sx={{
            overflowX: 'auto',
            border: '1px solid var(--pg-line)',
            borderRadius: '8px',
            bgcolor: '#fff',
            p: 2,
          }}
        >
          <svg
            role="img"
            aria-label={t('{{period}} 벡터 막대 그래프', { period: currentPreset.period })}
            viewBox="0 0 320 218"
            width={320 * zoom}
            height={218 * zoom}
            style={{
              display: 'block',
              maxWidth: 'none',
              color: '#0f172a',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <title>{t('{{period}} 벡터 막대 그래프', { period: currentPreset.period })}</title>
            <text x="0" y="20" fill="currentColor" fontSize="16" fontWeight="600">
              KPI · {currentPreset.period}
            </text>
            {currentPreset.metrics.map((metric, index) => (
              <g key={metric.name} transform={`translate(0 ${50 + index * 54})`}>
                <text x="0" y="0" fill="currentColor" fontSize="13">
                  {metric.name}
                </text>
                <text x="240" y="0" fill="currentColor" fontSize="13" textAnchor="end">
                  {metric.score}%
                </text>
                <rect x="0" y="12" width="240" height="10" fill="#e2e8f0" />
                <rect
                  x="0"
                  y="12"
                  width={Math.round((metric.score / 100) * 240)}
                  height="10"
                  fill={metric.color}
                />
                <line x1="0" y1="26" x2="240" y2="26" stroke="#cbd5e1" strokeWidth="1" />
              </g>
            ))}
          </svg>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {t(
            '벡터는 점과 선으로 그린 도형입니다. 200%로 확대해도 윤곽이 선명하며, PDF에도 같은 지표를 SVG 도형으로 그립니다.',
          )}
        </Typography>
        <DemoResultTable
          label={t('그래프 지표')}
          rows={currentPreset.metrics.map((metric) => ({
            label: metric.name,
            value: `${metric.score}%`,
          }))}
        />
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="contained"
            loading={busy}
            disabled={busy}
            onClick={() => void generateVectorPdf()}
          >
            {t('PDF 생성')}
          </Button>
          {renderedReport && (
            <Button
              size="small"
              variant="outlined"
              component="a"
              href={renderedReport.url}
              download={`owp-kpi-${renderedReport.period.toLowerCase()}.pdf`}
              onClick={() => onRecord('pdf.vector.download', renderedReport.period)}
            >
              {t('PDF 다운로드')}
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
                onClick={() => void generateVectorPdf()}
              >
                {t('다시 시도')}
              </Button>
            }
          >
            {errorMessage}
          </Alert>
        )}
        {renderedReport && !errorMessage && (
          <div role="status">
            <DemoResultTable
              label={t('생성 파일')}
              rows={[
                { label: t('기간'), value: renderedReport.period },
                { label: t('파일 크기'), value: `${renderedReport.size.toLocaleString()} bytes` },
              ]}
            />
          </div>
        )}
      </div>
    </section>
  );
}

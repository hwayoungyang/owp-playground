import { useOwpTranslation } from '@owp/components/hooks';
import { Document, downloadPdf, Page, renderPdfToBlob, StyleSheet, Text, View } from '@owp/pdf';
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
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { DemoResultTable } from '../../integrations/DemoResultTable';
import type { IntegrationExampleProps } from '../../integrations/catalog';

const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 32,
    color: '#1e293b',
  },
  header: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#475569',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  rowHeader: {
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 6,
  },
  cellCode: { width: '28%' },
  cellName: { width: '44%' },
  cellAmount: { width: '28%', textAlign: 'right' },
  footer: {
    marginTop: 18,
    fontSize: 9,
    color: '#64748b',
  },
});

const invoiceItems = [
  { code: 'INV-101', description: 'OWP Core Runtime License', amount: 'USD 2,400' },
  { code: 'INV-102', description: 'DataGrid Enterprise Module', amount: 'USD 3,800' },
  { code: 'INV-103', description: 'Technical Support Package', amount: 'USD 1,200' },
] as const;

function toAsciiText(input: string, fallback: string): string {
  const cleaned = input.replace(/[^\x20-\x7E]/g, '').trim();
  return cleaned || fallback;
}

function createInvoiceDocument(title: string, referenceCode: string) {
  const safeTitle = toAsciiText(title, 'OWP Service Summary');
  const safeReference = toAsciiText(referenceCode, 'REF-2026-1106');
  return (
    <Document title={safeTitle} author="OWP Playground">
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>{safeTitle}</Text>
          <Text style={pdfStyles.subtitle}>
            Reference: {safeReference} | Standard Font: Helvetica
          </Text>
        </View>
        <View style={[pdfStyles.row, pdfStyles.rowHeader]}>
          <Text style={pdfStyles.cellCode}>Code</Text>
          <Text style={pdfStyles.cellName}>Description</Text>
          <Text style={pdfStyles.cellAmount}>Amount</Text>
        </View>
        {invoiceItems.map((item) => (
          <View key={item.code} style={pdfStyles.row}>
            <Text style={pdfStyles.cellCode}>{item.code}</Text>
            <Text style={pdfStyles.cellName}>{item.description}</Text>
            <Text style={pdfStyles.cellAmount}>{item.amount}</Text>
          </View>
        ))}
        <Text style={pdfStyles.footer}>
          Generated locally by @owp/pdf without external font network requests.
        </Text>
      </Page>
    </Document>
  );
}

export function IntegrationExample({ onData, onRecord }: IntegrationExampleProps) {
  const { t } = useOwpTranslation();
  const mountedRef = useRef(true);
  const pendingRef = useRef(false);
  const blobUrlRef = useRef<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState('OWP Service Summary');
  const [referenceCode, setReferenceCode] = useState('REF-2026-1106');
  const [fileName, setFileName] = useState('owp-service-summary.pdf');
  const [busy, setBusy] = useState(false);
  const [lastMode, setLastMode] = useState<'blob' | 'download'>('blob');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blobInfo, setBlobInfo] = useState<{
    readonly size: number;
    readonly type: string;
    readonly url: string;
    readonly safeTitle: string;
  } | null>(null);

  function revokeCurrentBlobUrl() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      revokeCurrentBlobUrl();
    };
  }, []);

  useEffect(() => {
    onData({
      documentTitle,
      referenceCode,
      fileName,
      busy,
      errorMessage,
      blobSize: blobInfo?.size ?? null,
      blobType: blobInfo?.type ?? null,
      hasBlobUrl: Boolean(blobInfo?.url),
    });
  }, [documentTitle, referenceCode, fileName, busy, errorMessage, blobInfo, onData]);

  async function handlePdfAction(mode: 'blob' | 'download', requestedFileName = fileName) {
    if (pendingRef.current) return;
    setLastMode(mode);
    const targetFile = requestedFileName.trim();
    if (!targetFile) {
      setErrorMessage(t('다운로드할 PDF 파일명을 입력해 주세요.'));
      onRecord('pdf.error', 'Empty fileName');
      return;
    }
    pendingRef.current = true;
    setBusy(true);
    setErrorMessage(null);
    onRecord(`pdf.${mode}.start`, targetFile);
    try {
      const doc = createInvoiceDocument(documentTitle, referenceCode);
      const normalizedFile = targetFile.endsWith('.pdf') ? targetFile : `${targetFile}.pdf`;
      if (mode === 'download') {
        await downloadPdf(doc, normalizedFile);
      }
      const blob = await renderPdfToBlob(doc);
      if (!mountedRef.current) return;
      revokeCurrentBlobUrl();
      const nextUrl = URL.createObjectURL(blob);
      blobUrlRef.current = nextUrl;
      const safeTitle = toAsciiText(documentTitle, 'OWP Service Summary');
      setBlobInfo({
        size: blob.size,
        type: blob.type || 'application/pdf',
        url: nextUrl,
        safeTitle,
      });
      onRecord(`pdf.${mode}.success`, `${normalizedFile} (${blob.size} bytes)`);
    } catch (error) {
      if (!mountedRef.current) return;
      const message =
        error instanceof Error
          ? error.message
          : t('PDF 문서를 생성하지 못했습니다. 다시 시도해 주세요.');
      setErrorMessage(message);
      onRecord(`pdf.${mode}.error`, message);
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  return (
    <>
      <section
        className="components-example-section"
        aria-label={t('Helvetica 기반 PDF 생성과 다운로드')}
      >
        <div className="components-example-content">
          <div className="components-example-grid">
            <TextField
              size="small"
              fullWidth
              label={t('문서 제목 (ASCII)')}
              value={documentTitle}
              disabled={busy}
              onChange={(event) => {
                setDocumentTitle(event.target.value);
                setErrorMessage(null);
              }}
            />
            <TextField
              size="small"
              fullWidth
              label={t('참조 번호 (ASCII)')}
              value={referenceCode}
              disabled={busy}
              onChange={(event) => {
                setReferenceCode(event.target.value);
                setErrorMessage(null);
              }}
            />
            <TextField
              size="small"
              fullWidth
              label={t('저장 파일명')}
              value={fileName}
              disabled={busy}
              onChange={(event) => {
                setFileName(event.target.value);
                setErrorMessage(null);
              }}
            />
          </div>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              loading={busy && lastMode === 'blob'}
              disabled={busy}
              onClick={() => void handlePdfAction('blob')}
            >
              {t('PDF 생성')}
            </Button>
            <Button
              size="small"
              variant="contained"
              loading={busy && lastMode === 'download'}
              disabled={busy}
              onClick={() => void handlePdfAction('download')}
            >
              {t('PDF 다운로드')}
            </Button>
            {blobInfo && (
              <Button
                size="small"
                variant="outlined"
                component="a"
                href={blobInfo.url}
                download={
                  fileName.trim().endsWith('.pdf')
                    ? fileName.trim()
                    : `${fileName.trim() || 'report'}.pdf`
                }
                onClick={() => onRecord('pdf.blobUrl.download', blobInfo.safeTitle)}
              >
                {t('생성한 PDF 저장')}
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
                    const nextFileName = fileName.trim() || 'owp-service-summary.pdf';
                    setFileName(nextFileName);
                    void handlePdfAction(lastMode, nextFileName);
                  }}
                >
                  {t('다시 시도')}
                </Button>
              }
            >
              {errorMessage}
            </Alert>
          )}
          {blobInfo && !errorMessage && (
            <DemoResultTable
              label={t('생성 파일')}
              rows={[
                { label: t('문서 제목'), value: blobInfo.safeTitle },
                { label: t('파일 크기'), value: `${blobInfo.size.toLocaleString()} bytes` },
                { label: t('형식'), value: blobInfo.type },
              ]}
            />
          )}
        </div>
      </section>

      <section className="components-example-section" aria-label={t('문서 내용')}>
        <h2>{t('문서 내용')}</h2>
        <div className="components-example-content">
          <div className="integration-table-scroll">
            <Table size="small" aria-label={t('PDF 문서 항목')}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('코드')}</TableCell>
                  <TableCell>{t('내역')}</TableCell>
                  <TableCell align="right">{t('금액')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceItems.map((item) => (
                  <TableRow key={item.code}>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{item.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </>
  );
}

import { createRequire } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { normalizeFormDataUploadParams } from '@owp/core/utils';
import { describeFormData, sampleUploadText } from '../src/playgrounds/core/model/file-transfer';

const coreRequire = createRequire(import.meta.resolve('@owp/core'));
await import(coreRequire.resolve('notistack'));
vi.stubGlobal('window', { location: { search: '' } });
afterAll(() => vi.unstubAllGlobals());
const { useFormDataUploadMutation } = await import('@owp/core/hooks');

describe('Core upload public payload contract', () => {
  it('uses the default, page/table, or custom filename field and preserves explicit filenames', () => {
    const file = new File([sampleUploadText], 'sample.txt', { type: 'text/plain' });
    expect(normalizeFormDataUploadParams({ file })).toEqual({ file, FILE_NAME: 'sample.txt' });
    expect(
      normalizeFormDataUploadParams({ file, PAGEID: 'ITEM', TABLENAME: 'ATTACHMENT' }),
    ).toEqual({ file, PAGEID: 'ITEM', TABLENAME: 'ATTACHMENT', ITEM_ATTACHMENT: 'sample.txt' });
    expect(normalizeFormDataUploadParams({ file }, { fileNameFieldName: 'ORIGINAL_NAME' })).toEqual(
      { file, ORIGINAL_NAME: 'sample.txt' },
    );
    expect(normalizeFormDataUploadParams({ file, FILE_NAME: 'custom.txt' }).FILE_NAME).toBe(
      'custom.txt',
    );
  });

  it('passes actual FormData through createVariables to a preview mutation without an HTTP request', () => {
    const captured: { readonly body: FormData; readonly fileName: string }[] = [];
    const file = new File([sampleUploadText], 'sample.txt', { type: 'text/plain' });
    function PayloadPreview() {
      const upload = useFormDataUploadMutation({
        mutation: {
          mutate: (variables: { readonly body: FormData; readonly fileName: string }) => {
            captured.push(variables);
          },
        },
        createVariables: ({ formData, body }) => ({
          body: formData,
          fileName: String(body.FILE_NAME),
        }),
      });
      upload.uploadFile({ file, category: 'DEMO' });
      return null;
    }
    renderToStaticMarkup(<PayloadPreview />);
    expect(captured).toHaveLength(1);
    expect(captured[0]?.fileName).toBe('sample.txt');
    expect(captured[0]?.body).toBeInstanceOf(FormData);
    const formData = captured[0]?.body;
    if (!formData) throw new TypeError('Missing upload payload');
    expect(describeFormData(formData)).toEqual([
      {
        field: 'file',
        value: JSON.stringify({ name: 'sample.txt', size: file.size, type: 'text/plain' }),
      },
      { field: 'category', value: 'DEMO' },
      { field: 'FILE_NAME', value: 'sample.txt' },
    ]);
  });

  it('normalizes the filename field to NFC without changing the original file', () => {
    const file = new File([sampleUploadText], 'cafe\u0301.txt', { type: 'text/plain' });
    const body = normalizeFormDataUploadParams({ file });
    expect(body.FILE_NAME).toBe('café.txt');
    expect(body.file).toBe(file);
    expect(file.name).toBe('cafe\u0301.txt');
  });
});

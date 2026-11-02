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

  it.each([
    { field: 'FILE_NAME', fields: {}, fileNameFieldName: undefined },
    {
      field: 'ITEM_ATTACHMENT',
      fields: { PAGEID: 'ITEM', TABLENAME: 'ATTACHMENT' },
      fileNameFieldName: undefined,
    },
    { field: 'ORIGINAL_NAME', fields: {}, fileNameFieldName: 'ORIGINAL_NAME' },
  ])('passes the selected binary file and $field through the real upload hook', ({
    field,
    fields,
    fileNameFieldName,
  }) => {
    const captured: { readonly body: FormData; readonly fileName: string }[] = [];
    const file = new File([new Uint8Array([0, 255, 42])], 'selected-archive.bin');
    function PayloadPreview() {
      const upload = useFormDataUploadMutation({
        fileNameFieldName,
        mutation: {
          mutate: (variables: { readonly body: FormData; readonly fileName: string }) => {
            captured.push(variables);
          },
        },
        createVariables: ({ formData, body }) => ({
          body: formData,
          fileName: String(body[field]),
        }),
      });
      upload.uploadFile({ file, category: 'DEMO', ...fields });
      return null;
    }
    renderToStaticMarkup(<PayloadPreview />);
    expect(captured).toHaveLength(1);
    expect(captured[0]?.fileName).toBe(file.name);
    expect(captured[0]?.body).toBeInstanceOf(FormData);
    const formData = captured[0]?.body;
    if (!formData) throw new TypeError('Missing upload payload');
    expect(formData.get('file')).toBe(file);
    expect(describeFormData(formData)).toEqual([
      {
        field: 'file',
        value: JSON.stringify({ name: file.name, size: 3, type: '' }),
      },
      { field: 'category', value: 'DEMO' },
      ...Object.entries(fields).map(([field, value]) => ({ field, value })),
      { field, value: file.name },
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

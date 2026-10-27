export const sampleUploadText = 'Core upload payload preview\n';

export const sampleArchiveFiles = [
  { fileName: 'items.csv', content: 'id,status\n1,ACTIVE\n2,INACTIVE\n', type: 'text/csv' },
  { fileName: 'readme.txt', content: 'Core local ZIP example\n', type: 'text/plain' },
] as const;

export function describeFormData(formData: FormData) {
  return Array.from(formData.entries(), ([field, value]) => ({
    field,
    value:
      typeof value === 'string'
        ? value
        : JSON.stringify({ name: value.name, size: value.size, type: value.type }),
  }));
}

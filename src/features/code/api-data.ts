export type ApiValue = string | null | readonly ApiRow[];
export type ApiRow = { readonly [field: `OWP_DATA.DATA${number}`]: ApiValue };
export type ApiField = {
  readonly key: `OWP_DATA.DATA${number}`;
  readonly description: string;
  readonly notes?: readonly string[];
};
export type ApiDocument = {
  readonly rows: readonly ApiRow[];
  readonly fields: readonly ApiField[];
};

export type ApiDataSource = {
  readonly totalRows: number;
  readonly fields: readonly ApiField[];
  readonly getRows: (start: number, end: number) => readonly ApiRow[];
};

/** 필드 설명과 공통 안내를 각각 페이지에서 한 번만 표시하고 JSON 값을 보존합니다. */
export function formatApiData(document: ApiDocument, comments: boolean): string {
  const json = JSON.stringify(document.rows, null, 2);
  if (!comments) return json;
  const fields = new Map<string, ApiField>(document.fields.map((field) => [field.key, field]));
  const described = new Set<string>();
  return json.replace(/^(\s*)"(OWP_DATA\.DATA\d+)":(.*)$/gm, (line, _indent, key: string) => {
    const field = fields.get(key);
    if (!field) return line;
    const descriptions = [field.description, ...(field.notes ?? [])]
      .map((text) => text.replace(/[\r\n\u2028\u2029]+/g, ' ').trim())
      .filter((text) => {
        if (!text || described.has(text)) return false;
        described.add(text);
        return true;
      });
    return descriptions.length ? `${line} // ${descriptions.join(' · ')}` : line;
  });
}

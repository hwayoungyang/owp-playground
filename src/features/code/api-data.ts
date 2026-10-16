export type ApiValue = string | null | readonly ApiRow[];
export type ApiRow = { readonly [field: `OWP_DATA.DATA${number}`]: ApiValue };
export type ApiField = { readonly key: `OWP_DATA.DATA${number}`; readonly description: string };
export type ApiDocument = {
  readonly rows: readonly ApiRow[];
  readonly fields: readonly ApiField[];
};

export type ApiDataSource = {
  readonly totalRows: number;
  readonly fields: readonly ApiField[];
  readonly getRows: (start: number, end: number) => readonly ApiRow[];
};

/** 같은 설명은 표시 페이지의 첫 필드에만 추가하며 원래 값은 JSON escaping으로 보존합니다. */
export function formatApiData(document: ApiDocument, comments: boolean): string {
  const json = JSON.stringify(document.rows, null, 2);
  if (!comments) return json;
  const descriptions = new Map<string, string>(
    document.fields.map((field) => [field.key, field.description]),
  );
  const described = new Set<string>();
  return json.replace(/^(\s*)"(OWP_DATA\.DATA\d+)":(.*)$/gm, (line, _indent, key: string) => {
    const description = descriptions
      .get(key)
      ?.replace(/[\r\n\u2028\u2029]+/g, ' ')
      .trim();
    if (!description || described.has(description)) return line;
    described.add(description);
    return `${line} // ${description}`;
  });
}

import { CodeSnippet } from './CodeSnippet';

export function JsonResult({
  value,
  label = 'result.json',
}: {
  readonly value: unknown;
  readonly label?: string;
}) {
  const code = JSON.stringify(value, null, 2);
  return (
    <CodeSnippet
      label={label}
      code={code ?? 'undefined'}
      language={code === undefined ? 'typescript' : 'json'}
    />
  );
}

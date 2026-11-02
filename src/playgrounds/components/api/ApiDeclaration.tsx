import { useOwpTranslation } from '@owp/components/hooks';
import { CodeSnippet } from '../../../features/code/CodeSnippet';

export function ApiDeclaration({ declaration }: { readonly declaration: string }) {
  const { t } = useOwpTranslation();
  return (
    <details className="components-api-declaration">
      <summary>{t('타입 정의')}</summary>
      <CodeSnippet label="TypeScript" code={declaration} language="typescript" />
    </details>
  );
}

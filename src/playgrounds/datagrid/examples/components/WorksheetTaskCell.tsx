import { useOwpTranslation } from '@owp/components/hooks';
import type { Task } from '../../types';

export function WorksheetTaskCell({ row }: { readonly row: Task }) {
  const { t } = useOwpTranslation();
  return t(row.worksheetKind === 'rate' ? '기본 적용률' : row.task);
}

import { useOwpTranslation } from '@owp/components/hooks';

export function TaskStatusCell({
  status,
  className,
}: {
  readonly status: string;
  readonly className: string;
}) {
  const { t } = useOwpTranslation();
  return status ? (
    <span className={`status-badge ${className}`}>
      <span className="status-dot" />
      {t(status)}
    </span>
  ) : null;
}

import { useOwpTranslation } from '@owp/components/hooks';
import { packageIntroductions } from '../i18n/package-introductions';

export function FrameworkIntroduction({
  packageId,
}: {
  readonly packageId: keyof typeof packageIntroductions;
}) {
  const { t } = useOwpTranslation();
  return <p className="guide-introduction">{t(packageIntroductions[packageId])}</p>;
}

import { useOwpTranslation } from '@owp/components/hooks';
import { packageIntroductions } from '../../playgrounds/introductions';

export function FrameworkIntroduction({
  packageId,
}: {
  readonly packageId: keyof typeof packageIntroductions;
}) {
  const { t } = useOwpTranslation();
  return <p className="guide-introduction">{t(packageIntroductions[packageId])}</p>;
}

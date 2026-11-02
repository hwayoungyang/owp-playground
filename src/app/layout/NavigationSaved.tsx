import { useOwpTranslation } from '@owp/components/hooks';
import { StarIcon } from '@phosphor-icons/react';
import type { NavigationResult } from './navigation-search';
import { NavigationLink } from './NavigationLink';

export function NavigationSaved({
  entries,
  favorites,
  onNavigate,
}: {
  readonly entries: readonly NavigationResult[];
  readonly favorites: readonly string[];
  readonly onNavigate: (id: string) => void;
}) {
  const { t } = useOwpTranslation();
  const items = favorites.flatMap((id) => {
    const entry = entries.find((candidate) => candidate.item.id === id);
    return entry ? [entry] : [];
  });
  return items.length > 0 ? (
    <section className="nav-saved-group" aria-label={t('즐겨찾기')}>
      <div className="nav-group-heading">
        <StarIcon size={13} aria-hidden />
        {t('즐겨찾기')}
      </div>
      {items.map(({ item, kind }) => (
        <NavigationLink key={item.id} item={item} onNavigate={onNavigate} context={t(kind)} />
      ))}
    </section>
  ) : null;
}

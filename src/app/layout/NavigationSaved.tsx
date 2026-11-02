import { useOwpTranslation } from '@owp/components/hooks';
import { ClockCounterClockwiseIcon, StarIcon } from '@phosphor-icons/react';
import type { NavigationResult } from './navigation-search';
import { NavigationLink } from './NavigationLink';

export function NavigationSaved({
  entries,
  recent,
  favorites,
  onNavigate,
}: {
  readonly entries: readonly NavigationResult[];
  readonly recent: readonly string[];
  readonly favorites: readonly string[];
  readonly onNavigate: (id: string) => void;
}) {
  const { t } = useOwpTranslation();
  return [
    { label: '즐겨찾기', ids: favorites, icon: <StarIcon size={13} aria-hidden /> },
    { label: '최근 방문', ids: recent, icon: <ClockCounterClockwiseIcon size={13} aria-hidden /> },
  ].map(({ label, ids, icon }) => {
    const items = ids.flatMap((id) => {
      const entry = entries.find((candidate) => candidate.item.id === id);
      return entry && (label !== '최근 방문' || !entry.item.active) ? [entry] : [];
    });
    return items.length > 0 ? (
      <section className="nav-saved-group" key={label} aria-label={t(label)}>
        <div className="nav-group-heading">
          {icon}
          {t(label)}
        </div>
        {items.map(({ item, kind }) => (
          <NavigationLink key={item.id} item={item} onNavigate={onNavigate} context={t(kind)} />
        ))}
      </section>
    ) : null;
  });
}

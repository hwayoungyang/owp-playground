import { useOwpTranslation } from '@owp/components/hooks';
import { CaretDownIcon } from '@phosphor-icons/react';
import type { NavigationViewModel } from './navigation';
import { NavigationLink } from './NavigationLink';

export function NavigationGroups({
  model,
  collapsed,
  onToggle,
  onNavigate,
}: {
  readonly model: NavigationViewModel;
  readonly collapsed: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly onNavigate: (id: string) => void;
}) {
  const { t, i18n } = useOwpTranslation();
  return model.groups.map((group) => (
    <div className="nav-section-group" key={group.id}>
      <div className="nav-group-heading">{t(group.label)}</div>
      {group.type === 'docs'
        ? group.items.map((item) => (
            <NavigationLink key={item.id} item={item} onNavigate={onNavigate} />
          ))
        : group.categories.map((category) => {
            const expanded = !collapsed.has(category.id);
            const label = t(category.label);
            const bilingual = i18n.language.startsWith('ko')
              ? label.match(/^(.+) \(([^)]+)\)$/u)
              : null;
            return (
              <section className="nav-category" key={category.id}>
                <button
                  type="button"
                  className="category-label"
                  aria-label={label}
                  aria-expanded={expanded}
                  onClick={() => onToggle(category.id)}
                >
                  <span className="category-copy">
                    <span>{bilingual?.[1] ?? label}</span>
                    {bilingual?.[2] && (
                      <span className="category-subtitle" lang="en">
                        {bilingual[2]}
                      </span>
                    )}
                  </span>
                  <CaretDownIcon size={12} className={expanded ? '' : 'collapsed'} aria-hidden />
                </button>
                {expanded &&
                  category.items.map((item) => (
                    <NavigationLink key={item.id} item={item} onNavigate={onNavigate} />
                  ))}
              </section>
            );
          })}
    </div>
  ));
}

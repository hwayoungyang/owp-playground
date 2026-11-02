import { useOwpTranslation } from '@owp/components/hooks';
import { Tooltip } from '@mui/material';
import { CheckIcon } from '@phosphor-icons/react';
import type { NavigationItem } from './navigation';

export function NavigationLink({
  item,
  onNavigate,
  query = '',
  context,
}: {
  readonly item: NavigationItem;
  readonly onNavigate: (id: string) => void;
  readonly query?: string;
  readonly context?: string;
}) {
  const { t } = useOwpTranslation();
  const title = t(item.title);
  const match = query ? title.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) : -1;
  return (
    <Tooltip title={title} placement="right" describeChild>
      <a
        href={item.url}
        aria-current={item.active ? 'page' : undefined}
        className={'nav-item' + (item.active ? ' active' : '')}
        onClick={(event) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          event.preventDefault();
          if (item.active && item.id.startsWith('export:')) return;
          onNavigate(item.id);
        }}
      >
        <span className="nav-item-copy">
          <span className="nav-item-title">
            {match < 0 ? (
              title
            ) : (
              <>
                {title.slice(0, match)}
                <mark>{title.slice(match, match + query.length)}</mark>
                {title.slice(match + query.length)}
              </>
            )}
          </span>
          {context && <span className="nav-item-context">{context}</span>}
        </span>
        {item.active && <CheckIcon size={13} aria-hidden />}
      </a>
    </Tooltip>
  );
}

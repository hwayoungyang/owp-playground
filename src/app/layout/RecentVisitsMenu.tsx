import { useOwpTranslation } from '@owp/components/hooks';
import { IconButton, ListSubheader, Menu, MenuItem, Tooltip } from '@mui/material';
import { CheckIcon, ClockCounterClockwiseIcon } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import type { PlaygroundRoute } from '../../playgrounds/registry';
import type { RecentVisit } from './recent-visits';
import { recentVisitKey } from './recent-visits';
import { resolveRecentNavigation } from './recent-navigation';
import { useRecentVisits } from './useRecentVisits';
import './recent-visits.css';

export function RecentVisitsMenu({
  current,
  onNavigate,
}: {
  readonly current: RecentVisit | undefined;
  readonly onNavigate: (route: PlaygroundRoute) => void;
}) {
  const { t, i18n } = useOwpTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  const { visits, temporary } = useRecentVisits(current);
  const entries = visits.flatMap((visit) => {
    const entry = resolveRecentNavigation({
      visit,
      baseUrl: location.href,
      language: i18n.language,
    });
    return entry ? [{ ...entry, visit }] : [];
  });
  return (
    <>
      <Tooltip title={t('최근 방문')}>
        <IconButton
          id={`${id}-trigger`}
          className="recent-visits-trigger"
          aria-label={t('최근 방문')}
          aria-haspopup="menu"
          aria-controls={anchor ? `${id}-menu` : undefined}
          aria-expanded={Boolean(anchor)}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          <ClockCounterClockwiseIcon size={18} aria-hidden />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{
          paper: { className: 'recent-visits-menu' },
          list: { id: `${id}-menu`, 'aria-labelledby': `${id}-trigger` },
        }}
      >
        <ListSubheader className="recent-visits-heading" role="presentation" disableSticky>
          {t('최근 방문')}
        </ListSubheader>
        {entries.length === 0 && (
          <MenuItem disabled>{t('최근 방문한 페이지가 없습니다.')}</MenuItem>
        )}
        {entries.map((entry) => {
          const active =
            current !== undefined && recentVisitKey(entry.visit) === recentVisitKey(current);
          return (
            <MenuItem
              key={recentVisitKey(entry.visit)}
              component="a"
              href={entry.href}
              aria-current={active ? 'page' : undefined}
              onClick={(event) => {
                setAnchor(null);
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                if (!active) onNavigate(entry.route);
              }}
            >
              <span className="recent-visits-copy">
                <span className="recent-visits-title">{t(entry.title)}</span>
                <span className="recent-visits-context">
                  {entry.packageTitle} · {t(entry.kind)}
                </span>
              </span>
              {active && <CheckIcon size={14} aria-hidden />}
            </MenuItem>
          );
        })}
        {temporary && (
          <ListSubheader className="recent-visits-note" role="presentation" disableSticky>
            {t('최근 방문은 현재 탭에서만 유지됩니다.')}
          </ListSubheader>
        )}
      </Menu>
    </>
  );
}

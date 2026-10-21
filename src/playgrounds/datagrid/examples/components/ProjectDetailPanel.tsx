import { useOwpTranslation } from '@owp/components/hooks';
import type { Task } from '../../types';
import type { OwpDataGridDetailRenderParams } from '@owp/datagrid/types';

export function ProjectDetailPanel({
  row,
  rows,
  loading,
}: OwpDataGridDetailRenderParams<Task, Task>) {
  const { t } = useOwpTranslation();
  return (
    <div className="project-detail">
      <div>
        <span className="eyebrow">{t('프로젝트 요약')}</span>
        <h3>{row.project}</h3>
        <p>
          {loading
            ? t('프로젝트를 불러오는 중…')
            : t('작업 {{count}}개 · 담당자 {{owner}}', {
                count: rows.length,
                owner: row.owner,
              })}
        </p>
      </div>
      <div className="project-progress">
        <span className="eyebrow">{t('작업 현황')}</span>
        <dl>
          {[
            { label: '계획', value: rows.reduce((total, item) => total + item.quantity, 0) },
            { label: '완료', value: rows.reduce((total, item) => total + item.completed, 0) },
            {
              label: '남은 수량',
              value: rows.reduce(
                (total, item) => total + Math.max(0, item.quantity - item.completed),
                0,
              ),
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt>{t(label)}</dt>
              <dd>{loading ? '—' : value}</dd>
            </div>
          ))}
        </dl>
        <p>
          {t('다음 마감일')} · {row.date}
        </p>
        <span className="project-progress-note">
          {t('남은 작업량과 다음 마감일을 함께 표시합니다.')}
        </span>
      </div>
      <div
        className="weekly-chart"
        role="img"
        aria-label={t('월~금 완료 수량: 12, 28, 21, 36, 32')}
      >
        <span>{t('주간 완료 수량')}</span>
        <div>
          {[12, 28, 21, 36, 32].map((value, index) => (
            <div key={value}>
              <i style={{ height: `${value * 2}px` }} />
              <span>{t(['월', '화', '수', '목', '금'][index] ?? '')}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

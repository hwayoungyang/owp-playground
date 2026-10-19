import { useOwpTranslation } from '@owp/components/hooks';
import { useChartPalette } from '../model/useCartesian';

export function ThresholdExplanation({
  value,
  kind = 'column',
}: {
  readonly value: number;
  readonly kind?: 'column' | 'line' | 'pie';
}) {
  const { t } = useOwpTranslation();
  const palette = useChartPalette();
  return (
    <div className="chart-threshold-note">
      <p className="chart-note">
        {t('각 항목의 생산량이 {{value}}개 이상인지에 따라 색상을 구분합니다.', { value })}
      </p>
      <div className="chart-threshold-key">
        <span>
          <i style={{ backgroundColor: palette.colors[0] }} aria-hidden="true" />
          {t('기준값 이상 (≥ {{value}}개)', { value })}
        </span>
        <span>
          <i style={{ backgroundColor: palette.colors[1] }} aria-hidden="true" />
          {t('기준값 미만 (< {{value}}개)', { value })}
        </span>
      </div>
      {kind === 'line' && (
        <p className="chart-note">
          {t(
            'Line 색상으로 생산 라인을 구분합니다. Point 반지름은 기준값 이상이면 7px, 미만이면 3px입니다.',
          )}
        </p>
      )}
      {kind === 'column' && (
        <p className="chart-note">
          {t(
            '왼쪽 Column은 라인 A, 오른쪽은 라인 B를 나타냅니다. 같은 색이어도 툴팁에서 같은 월의 두 값을 구분할 수 있습니다.',
          )}
        </p>
      )}
      {kind === 'pie' && (
        <p className="chart-note">
          {t(
            '조각의 크기는 생산 비중을, 색상은 기준값 이상인지 여부를 나타냅니다. 같은 색의 조각도 툴팁에서 공정을 구분할 수 있습니다.',
          )}
        </p>
      )}
    </div>
  );
}

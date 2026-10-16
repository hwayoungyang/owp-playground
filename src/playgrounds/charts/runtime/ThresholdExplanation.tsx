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
        {t(
          '각 월·라인의 생산량을 기준값 {{value}}개와 비교합니다. 기준값은 생산량을 분류하기 위한 예제 설정입니다.',
          { value },
        )}
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
            'Line의 색상은 라인을 구분합니다. Point는 기준값 이상이면 반지름 7px, 미만이면 3px로 표시합니다.',
          )}
        </p>
      )}
      {kind === 'column' && (
        <p className="chart-note">
          {t(
            '각 월의 왼쪽 Column은 라인 A, 오른쪽은 라인 B입니다. 색상은 생산량과 기준값을 비교한 결과입니다.',
          )}
        </p>
      )}
      {kind === 'pie' && (
        <p className="chart-note">
          {t(
            '색상은 각 조각의 원본 생산량으로 정합니다. 조각 크기는 전체 생산량에서 차지하는 비율입니다.',
          )}
        </p>
      )}
    </div>
  );
}

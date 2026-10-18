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
          '각 항목의 생산량을 기준값 {{value}}개와 비교합니다. 기준값은 생산량을 분류하기 위한 예제 설정입니다.',
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
            '같은 색상이어도 왼쪽 Column은 라인 A, 오른쪽은 라인 B입니다. 툴팁에는 같은 월의 두 라인 값이 표시됩니다.',
          )}
        </p>
      )}
      {kind === 'pie' && (
        <p className="chart-note">
          {t(
            '조각의 크기는 생산 비중, 색상은 기준값 충족 여부를 나타냅니다. 같은 색상이어도 공정별 조각과 툴팁은 유지됩니다.',
          )}
        </p>
      )}
    </div>
  );
}

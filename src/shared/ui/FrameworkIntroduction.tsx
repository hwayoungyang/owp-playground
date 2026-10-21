import { useOwpTranslation } from '@owp/components/hooks';

export function FrameworkIntroduction({
  packageId,
}: {
  readonly packageId: 'charts' | 'datagrid';
}) {
  const { t } = useOwpTranslation();
  return (
    <p className="guide-introduction">
      {packageId === 'datagrid'
        ? t(
            '(주)임픽스의 애플리케이션 개발과 SI 프로젝트에서 대용량 데이터 처리와 계층형 데이터 조회·편집을 지원하는 React DataGrid 패키지입니다.',
          )
        : t('(주)임픽스의 애플리케이션 개발과 SI 프로젝트를 위한 React 차트 패키지입니다.')}
    </p>
  );
}

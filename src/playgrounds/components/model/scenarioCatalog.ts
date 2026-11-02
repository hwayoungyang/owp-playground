import type { ComponentsExample } from './types';

export const scenarioCatalog = (
  [
    {
      id: 'scenario-order-entry',
      title: '주문 수량과 금액 입력',
      category: 'input-examples',
      description: '수량과 단가를 입력하면 공급가액과 세액을 계산해 주문 금액을 표시합니다.',
      api: ['OwpNumberField', 'OwpFieldTable'],
    },
    {
      id: 'scenario-contact-entry',
      title: '연락처 입력과 확인',
      category: 'input-examples',
      description: '연락처 형식을 지정하고 필수 입력 안내와 오류 메시지를 함께 표시합니다.',
      api: ['OwpTextMaskField', 'OwpFieldHelperText', 'OwpRequiredHelperText'],
    },
    {
      id: 'scenario-search-results',
      title: '검색 조건과 결과 목록',
      category: 'data-examples',
      description: '항목명과 사용 여부로 목록을 검색하고 조건을 초기화합니다.',
      api: ['OwpSearchFilter', 'OwpOptionSelector', 'OwpTable'],
    },
    {
      id: 'scenario-record-details',
      title: '목록에서 상세 정보 보기',
      category: 'data-examples',
      description: '항목을 선택하면 기본 정보와 수량 내역을 표로 표시합니다.',
      api: ['OwpOptionSelector', 'OwpFieldTable', 'OwpTable', 'OwpSection'],
    },
    {
      id: 'scenario-edit-dialog',
      title: '편집 창과 미저장 내용 확인',
      category: 'workflow-examples',
      description: '편집한 값을 저장하거나 닫을 때 저장하지 않은 내용을 버릴지 확인합니다.',
      api: ['OwpDialog', 'useDiscardGuard'],
    },
    {
      id: 'scenario-page-layout',
      title: '페이지 제목과 본문 구성',
      category: 'layout-examples',
      description: '페이지 제목과 작업 버튼을 배치하고 본문을 탭과 섹션으로 나눕니다.',
      api: ['OwpPageContent', 'OwpSection', 'OwpTabs', 'OwpTab'],
    },
  ] satisfies readonly Pick<
    ComponentsExample,
    'id' | 'title' | 'category' | 'description' | 'api'
  >[]
).map((entry): ComponentsExample => ({
  ...entry,
  kind: 'component',
  package: '@owp/components',
  source: `examples/${entry.id}.tsx`,
}));

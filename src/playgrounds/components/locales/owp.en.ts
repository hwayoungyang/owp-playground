export const componentsOwpEnglish = {
  'Label.건': 'items',
  'Label.검색': 'Search',
  'Label.계속 편집': 'Keep editing',
  'Label.닫기': 'Close',
  'Label.덮어쓰기': 'Overwrite',
  'Label.로딩 중...': 'Loading...',
  'Label.변경': 'Change',
  'Label.삭제': 'Delete',
  'Label.수정': 'Update',
  'Label.엑셀 업로드': 'Upload Excel',
  'Label.이동': 'Leave',
  'Label.저장': 'Save',
  'Label.전체': 'All',
  'Label.조회': 'Search',
  'Label.진행': 'Continue',
  'Label.초기화': 'Reset',
  'Label.취소': 'Cancel',
  'Label.확인': 'OK',
  'Message.검색 결과 없음': 'No matching results',
  'Message.계속 진행하면 저장하지 않은 변경 내용을 덮어씁니다.':
    'Continuing will overwrite your unsaved changes.',
  'Message.다시 조회하면 저장하지 않은 변경 내용이 사라집니다.':
    'Searching again will discard your unsaved changes.',
  'Message.문제가 발생했습니다.': 'Something went wrong.',
  'Message.삭제하시겠습니까?': 'Delete this item?',
  'Message.수정하시겠습니까?': 'Apply these changes?',
  'Message.저장하시겠습니까?': 'Save these changes?',
  'Message.저장하지 않고 닫으면 변경 내용이 사라집니다.':
    'Closing without saving will discard your changes.',
  'Message.저장하지 않고 이동하면 변경 내용이 사라집니다.':
    'Leaving without saving will discard your changes.',
  'Message.저장하지 않고 진행하면 변경 내용이 사라집니다. 진행하시겠습니까?':
    'Continuing without saving will discard your changes. Continue?',
  'Message.저장하지 않은 변경 내용이 있습니다.': 'You have unsaved changes.',
  'Message.조회 결과가 없습니다.': 'No results found.',
  'Message.처리하시겠습니까?': 'Continue with this action?',
  'Message.초기화하면 저장하지 않은 변경 내용이 사라집니다.':
    'Resetting will discard your unsaved changes.',
  'Message.편집 대상을 변경하면 저장하지 않은 변경 내용이 사라집니다.':
    'Selecting a different item will discard your unsaved changes.',
} as const;

export const componentsOwpKorean = {
  ...Object.fromEntries(
    Object.keys(componentsOwpEnglish).map((key) => [key, key.slice(key.indexOf('.') + 1)]),
  ),
  'Message.처리하시겠습니까?': '계속 진행하시겠습니까?',
} as const;

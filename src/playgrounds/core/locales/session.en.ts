export const sessionEnglish: Readonly<Record<string, string>> = {
  '사용자를 선택하면 샘플 인증 정보와 메뉴가 바로 바뀝니다. Core는 메뉴의 C/R/U/D 플래그로 권한을 판단합니다.':
    'Selecting a user immediately applies their sample identity and navigation. Core evaluates the menu C/R/U/D flags to determine permissions.',
  '조회 결과가 없습니다.': 'No results found.',
  'Super admin·Admin·PM 샘플 사용자를 선택하면 페이지별 생성·조회·수정·삭제 권한이 O/X로 바로 바뀝니다.':
    'Select Super admin, Admin, or PM to immediately update the O/X table of create, read, update, and delete permissions for each page.',
  '사용자와 페이지 권한': 'User and page permissions',
  '샘플 인증 응답과 메뉴 정보를 적용하고 페이지별 권한을 확인합니다.':
    'Apply a sample authentication response and navigation, then check permissions for each page.',
  '읽기 전용': 'Read only',
  '편집 가능': 'Editable',
  권한: 'Permissions',
  경로: 'Path',
  항목: 'Items',
  설정: 'Settings',
  페이지: 'Page',
  '페이지 권한': 'Page permissions',
  가능: 'Allowed',
  불가: 'Denied',
  '인증 서버를 호출하지 않고 샘플 인증 응답을 적용합니다.':
    'Apply a sample authentication response without calling an authentication server.',
  '현재 페이지: {{path}}': 'Current page: {{path}}',
  '샘플 인증 응답을 적용했습니다.': 'Applied the sample authentication response.',
  '샘플 사용자 정보를 저장하지 못했습니다.': 'Could not save the sample user information.',
  '저장소에 접근할 수 없어 사용자 예제를 준비하지 못했습니다.':
    'Could not prepare the user example because storage is unavailable.',
  '샘플 사용자 상태를 준비하고 있습니다.': 'Preparing the sample user state.',
  '샘플 사용자': 'Sample user',
  '세 역할은 앱에서 정의한 샘플 프리셋입니다. Core는 역할 이름이 아니라 메뉴의 C/R/U/D 플래그로 권한을 판단합니다.':
    'These three roles are sample presets defined by the app. Core evaluates the menu C/R/U/D flags to determine permissions.',
  'Super admin은 모든 작업, Admin은 항목 생성·조회·수정과 설정 조회·수정, PM은 항목 생성·조회만 허용합니다.':
    'Super admin allows all actions. Admin allows item creation, reading and updating, plus settings reading and updating. PM allows only item creation and reading.',
  '적용된 사용자: {{role}} ({{userId}})': 'Applied user: {{role}} ({{userId}})',
  '생성 (C)': 'Create (C)',
  '조회 (R)': 'Read (R)',
  '수정 (U)': 'Update (U)',
  '삭제 (D)': 'Delete (D)',
  '적용된 사용자의 페이지 권한': 'Page permissions for the applied user',
};

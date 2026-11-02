import { interfaceKorean } from './interface.ko';
import { chartKorean } from '../../playgrounds/charts/locales/clarity.ko';

export const koreanOverrides: Readonly<Record<string, string>> = {
  ...interfaceKorean,
  ...chartKorean,
  '공용 MCP 주소': 'MCP 서버 주소',
  '설정 후 기대효과': '적용 결과',
  '앱에서 연결할 부분': '앱 연동 방법',
  '패키지별 역할과 연결': '패키지별 기능과 연동',
  '패키지별 역할과 연결 방법 보기': '패키지별 연동 방법 보기',
  '실행 원본 코드': '예제 소스 코드',
  '실행에 사용한 원본 코드입니다.': '미리보기에서 실행하는 소스 코드입니다.',
  '예제 실행 영역': '예제 미리보기',
  '경계 그림자 색상': '스크롤 가장자리 그림자 색상',
  '경계 효과 시간 (ms)': '스크롤 끝 효과 시간 (ms)',
  '경계 효과 색상': '스크롤 끝 효과 색상',
  '경계 효과 크기': '스크롤 끝 효과 크기',
  '화면 경계 여백': '화면 가장자리 여백',
  '오류 경계 복구': '화면 복구',
  '오류 경계와 수동 복구': 'Error Boundary와 오류 복구',
  '기본 오류 경계': '기본 Error Boundary',
  '오류 경계에서 렌더 오류를 처리하고 복구합니다.':
    'Error Boundary로 render 중 발생한 오류를 처리하고 화면을 복구합니다.',
  '버튼을 누르면 하위 render에서 한 번 오류를 발생시킵니다. 복구하면 오류 경계를 다시 생성합니다.':
    '버튼을 누르면 하위 컴포넌트의 render 중 오류를 한 번 발생시킵니다. 복구하면 Error Boundary를 새로 생성합니다.',
  '메시지와 홈 이동 링크를 표시하는 별도 컴포넌트입니다. 오류를 잡는 경계와 역할을 비교하세요.':
    '오류 메시지와 홈으로 이동하는 링크를 표시합니다. 오류를 처리하는 Error Boundary와 비교해 보세요.',
  'scroll=normal로 바깥 페이지가 세로 스크롤을 소유합니다. 이 예제는 Data Router 이탈 보호를 사용하지 않습니다.':
    'scroll=normal이면 바깥 페이지의 세로 스크롤을 사용합니다. 이 예제는 Data Router의 페이지 이동 확인 기능을 사용하지 않습니다.',
  'linear는 가용 너비 안에 진행 막대를 표시합니다.':
    'linear는 컨테이너 너비에 맞춰 진행 막대를 표시합니다.',
  'maximized로 viewport 안의 가용 공간을 사용하고 보조 작업을 추가합니다.':
    'maximized로 다이얼로그를 viewport에 맞게 확장하고 보조 버튼을 추가합니다.',
  'Core가 직접 구현한 기능을 역할별로 정리했습니다. 각 기능의 설정 방법과 기대효과를 확인하고 문서·실행 예제·공개 API로 이동할 수 있습니다.':
    'Core의 기능별 사용법과 설정을 확인합니다. 각 항목에서 가이드·예제·API 문서로 이동할 수 있습니다.',
  'Core·Style·UI 프로바이더와 useInitApp을 앱 진입점에 연결합니다. 페이지들이 같은 환경·테마·공통 UI를 사용합니다.':
    '앱 초기화 코드에 Core·Style·UI Provider와 useInitApp을 추가합니다. 각 페이지는 같은 앱 설정·테마·공통 UI를 사용합니다.',
  'OwpCoreProvider: 앱 환경과 상태의 시작점': 'OwpCoreProvider: 앱 환경과 상태 초기화',
  'OwpStyleProvider: 설정을 실제 스타일로 적용': 'OwpStyleProvider: 테마 적용',
  'Core의 앱 기능과 Components·Theme·Excel·Utils의 공개 API를 필요한 위치에 직접 연결합니다. 공통 UI의 동작과 타입은 소유 패키지에서 확인합니다.':
    'Core의 앱 기능과 Components·Theme·Excel·Utils의 공개 API를 필요한 위치에 직접 연결합니다. 공통 UI의 동작과 타입은 해당 UI를 제공하는 패키지에서 확인합니다.',
  'useSetSettings는 현재 설정을, useChangeOwpTheme는 기본·현재 테마를 메모리 store에서 갱신합니다. 설정 저장은 앱의 책임이며 useStorage는 앱 환경 조회·저장과 storage 초기화를 제공합니다.':
    'useSetSettings는 현재 설정을, useChangeOwpTheme는 기본·현재 테마를 메모리 store에서 갱신합니다. 설정 저장은 앱에서 구현해야 합니다. useStorage로 앱 환경을 조회·저장하고 storage를 초기화할 수 있습니다.',
  '입력값 아래에 필드별 도움말을 연결합니다.': '입력란 아래에 필드별 도움말을 표시합니다.',
  'data의 값과 필수 표시를 row 단위 layout에 연결합니다.':
    'data의 값과 필수 입력 표시를 행별 layout에 배치합니다.',
  'orientation과 disabled로 세로 탐색과 선택 불가 항목을 구성합니다.':
    'orientation으로 탭을 세로로 배치하고 disabled로 선택할 수 없는 항목을 지정합니다.',
  '각 예제는 실제 viewport를 독립적으로 구독합니다. 창 너비를 바꿔 비교하세요.':
    '각 예제는 브라우저 viewport 변화를 따로 감지합니다. 창 너비를 바꿔 비교하세요.',
  'isMobile은 xs에서만 true입니다. 좁은 카드의 너비를 device로 해석하지 않습니다.':
    'isMobile은 xs에서만 true입니다. device는 카드 너비를 기준으로 판단하지 않습니다.',
  'boolean을 그대로 평가': 'boolean 값 그대로 반환',
  'false와 true를 그대로 반환합니다. 평가 때문에 입력값이나 저장 기준을 바꾸지 않습니다.':
    'false와 true를 그대로 반환합니다. 평가 과정에서 입력값이나 저장한 내용을 바꾸지 않습니다.',
  '현재 dirty 평가': '현재 변경 여부 확인',
  '저장 기준 갱신': '현재 메모를 비교 기준으로 설정',
  '다른 셀에도 도움말 높이 확보': '도움말이 없는 셀에도 여백 추가',
  '도움말이 없는 콘텐츠에 after 여백을 추가합니다. 도움말이 있는 콘텐츠에는 중복 추가하지 않습니다.':
    '도움말이 없는 콘텐츠에도 같은 높이의 여백을 추가합니다. 도움말이 있는 콘텐츠에는 중복 추가하지 않습니다.',
  '별도 theme의 sm=480, lg=1024, xl=1440 값을 사용합니다. 앱 전체 theme는 바꾸지 않습니다.':
    '이 예제에서만 사용하는 theme에 sm=480, lg=1024, xl=1440을 지정합니다. 앱 전체 theme는 바꾸지 않습니다.',
  '컴포넌트가 메뉴 열림을 관리하고 클릭한 작업에서 메뉴를 닫습니다.':
    '컴포넌트가 메뉴의 열림 상태를 관리합니다. 메뉴 항목의 callback에서 메뉴를 닫습니다.',
  '별도 버튼과 open·onOpenChange로 메뉴 열림을 제어합니다.':
    '별도 버튼과 open·onOpenChange로 메뉴를 열고 닫습니다.',
  '정적 option을 드롭다운에서 하나 선택합니다.':
    '미리 정의한 option 중 하나를 드롭다운에서 선택합니다.',
  '최소 폭 표': '최소 너비를 지정한 표',
  '저장 버튼의 실행 횟수는 Data에서 볼 수 있습니다.':
    '저장 버튼을 누른 횟수는 데이터 탭에서 확인할 수 있습니다.',
  '공개 반응형 스타일 값을 선택해 샘플 영역에 적용합니다.':
    '패키지에서 제공하는 반응형 스타일을 선택해 샘플 영역에 적용합니다.',
  '사용자와 페이지 권한': '사용자별 페이지 권한',
  '연결된 위치 정보가 없어 예제 진입 파일 표시':
    '코드 위치 정보가 없어 예제의 시작 파일을 표시합니다.',
  '현재 파일에서 연결된 코드 위치를 찾지 못함': '현재 파일에서 연결된 코드 위치를 찾지 못했습니다.',
  '일치하는 API 항목 없음': '검색어와 일치하는 API 항목이 없습니다.',
  '입력값은 다이얼로그를 연 시점의 행. 전달받은 API로 버튼을 누른 시점의 메인 Grid 조회 가능.':
    '입력값은 다이얼로그를 연 시점의 행을 기준으로 합니다. 전달받은 API로 버튼을 누른 시점의 메인 Grid를 조회할 수 있습니다.',
  'Hook과 Ref는 같은 Grid API를 제공하며 연결 방식만 다름.':
    'Hook과 Ref는 같은 Grid API를 제공하며 연결 방식이 다릅니다.',
  '안정적인 API 객체로 연결된 Grid 제어 가능. 연결 전·해제 후 호출 시 ReferenceError 발생.':
    '안정적인 API 객체로 연결된 Grid를 제어할 수 있습니다. 연결 전·해제 후 호출하면 ReferenceError가 발생합니다.',
  'ref.current로 연결된 Grid 제어 가능. 연결 전·해제 후 current는 null.':
    'ref.current로 연결된 Grid를 제어할 수 있습니다. 연결 전·해제 후 current는 null입니다.',
  'hasUnsavedChanges()로 미확정 입력까지 감지 가능. getChanges()는 working-copy 변경만 반환. 현재 변경 상태 조회 버튼은 편집을 확정하지 않으며, 결과는 조회 시점 기준.':
    'hasUnsavedChanges()로 미확정 입력까지 감지할 수 있습니다. getChanges()는 working-copy 변경만 반환합니다. 현재 변경 상태 조회 버튼은 편집을 확정하지 않으며, 결과는 조회 시점을 기준으로 합니다.',
  '업로드 payload 준비': '업로드 데이터 준비',
  '저장소 경계': '설정 상태의 저장 위치',
  '화면 잠금 로딩 정책': '로딩 중 화면 잠금',
  'query는 DT를 FR_DATE·TO_DATE로 나누고, form은 두 날짜를 DT로 합칩니다. JSON 변환은 숫자·boolean을 문자열로 바꾸며, 이 예제는 요청 로그 필드를 제외합니다.':
    'query 모드에서는 DT를 FR_DATE·TO_DATE로 나누고, form 모드에서는 두 날짜를 DT로 합칩니다. JSON 변환은 숫자·boolean을 문자열로 바꾸며, 이 예제에서는 요청 로그 필드를 제외합니다.',
  '동적 import(청크) 실패는 sessionStorage 키 기준으로 1회 자동 새로고침을 시도하며, 일반 렌더 오류는 원인을 해결한 뒤 key 재마운트로 복구합니다.':
    '동적 import(청크)에 실패하면 sessionStorage 키를 기준으로 자동 새로고침을 한 번 시도합니다. 일반 렌더링 오류는 원인을 해결한 뒤 key를 바꿔 컴포넌트를 다시 마운트해 복구합니다.',
  '렌더 오류 경계와 수동 복구': 'Error Boundary와 오류 복구',
  'Y/N 기본 문구·사용자 문구·전체 선택을 비교합니다.':
    'Y/N의 기본 문구와 사용자 지정 문구, 전체 선택 옵션을 비교합니다.',
  '페이지 제목·보조 정보·저장 버튼·제목 로딩을 구성합니다.':
    '페이지 제목·보조 정보·저장 버튼을 배치하고 제목 영역에 로딩 상태를 표시합니다.',
  '페이지 제목 로딩': '제목 영역의 로딩 표시',
  '확인과 취소·안내 전용·경고 버튼 확인창을 비교합니다.':
    '확인·취소 버튼이 있는 창, 안내 전용 창, 확인 버튼에 경고 색상을 적용한 창을 비교합니다.',
  '기본·전체 화면·제목 안 전환 버튼 패널을 각각 엽니다.':
    '기본 패널, 전체 화면 패널, 제목 영역에 전환 버튼이 있는 패널을 각각 엽니다.',
  '넓이에 따라 버튼 배치': '창 너비에 따른 버튼 배치',
  '기능별 API 안내': '주요 기능',
  'useAppState는 공유 상태와 로컬 선택 값을 구분하는 앱 코드입니다. applyLogin에는 서버가 인증에 성공한 사용자 응답을 전달합니다. 메뉴를 교체하면 usePagePermission이 현재 Router 경로와 메뉴의 CRUD 권한을 기준으로 계산하고, 설정을 변경하면 같은 store를 사용하는 화면에 반영됩니다.':
    '아래 useAppState는 Core의 사용자 정보·메뉴·설정과 페이지의 selectedId를 함께 반환하는 custom Hook입니다. applyLogin에는 서버 인증에 성공한 뒤 받은 사용자 응답을 전달합니다. 메뉴를 바꾸면 usePagePermission이 현재 Router 경로와 메뉴의 CRUD 권한을 기준으로 페이지 권한을 계산합니다. 설정을 바꾸면 같은 store를 사용하는 화면에도 반영됩니다.',
  'baseUrl과 accessTokenTransport를 Provider의 env와 맞춥니다. bearer는 Authorization 헤더로 token을 전달합니다. successResultCode는 OWP 모드에서 서버가 성공으로 반환하는 문자열이며, 지정하면 HTTP 성공과 resultCode의 정확한 일치를 함께 확인합니다. isI18nEnabled를 켜면 언어 query parameter를 전달합니다. authErrors는 resultMessage의 포함 문자열 목록이고, onAuthError는 해당 인증 오류에서 로그인 이동 등을 처리하는 callback입니다. responseMode와 allowMissingResultCode는 factory 설정이 아니라 각 요청의 options에 지정합니다.':
    'baseUrl과 accessTokenTransport를 Provider의 env와 맞춥니다. bearer는 Authorization 헤더로 token을 전달합니다. successResultCode는 OWP 모드에서 서버가 성공으로 반환하는 문자열이며, 지정하면 HTTP 성공과 resultCode의 정확한 일치를 함께 확인합니다. isI18nEnabled를 켜면 언어 query parameter를 전달합니다. authErrors에는 resultMessage에 포함되어 있는지 확인할 문자열 목록을 지정합니다. onAuthError는 해당 인증 오류가 발생했을 때 로그인 페이지 이동 등을 처리하는 callback입니다. responseMode와 allowMissingResultCode는 factory 설정이 아니라 각 요청의 options에 지정합니다.',
  '앱 초기화와 실행 범위': '앱 초기화',
  '공통코드 상태와 선택': '공통코드 관리',
  '앱 설정과 테마 상태': '앱 설정',
  '확인 창과 다이얼로그 상태': '다이얼로그',
  '미저장 변경과 화면 정책': '저장하지 않은 변경 내용 확인',
  '요청 진행과 화면 잠금': '조회 실행과 로딩 표시',
  '검색 조건과 JSON 변환': '요청 파라미터 변환',
  '파일 데이터와 ZIP 저장': '파일 업로드 준비와 ZIP 다운로드',
  '언어 초기화와 코드 변환': '언어 설정',
  'Store와 기본 구성': 'Store 설정',
  '상태 관리': '사용자·메뉴·설정 관리',
  '공유 상태를 읽고 변경하는 방법': '사용자·메뉴·설정 조회와 변경',
  '메모리와 저장 상태의 수명': '새로고침 후 데이터 유지',
  '확인과 알림': '확인창과 알림창',
  '다이얼로그 상태 관리': '다이얼로그 열기와 저장',
  '미저장 변경 확인': '저장하지 않은 변경 내용 확인',
  '공통코드 hook으로 그룹 목록을 읽고 설정하며 필터링합니다. selector는 이 상태와 조회를 연결합니다.':
    '공통코드 hook으로 코드 목록을 읽거나 갱신하고 조건에 맞는 코드를 필터링합니다. OwpCommonCodeSelector·OwpCommonCodeRadioGroup·OwpCommonCodeQuerySelector로 공통코드 선택 UI를 구성합니다.',
  '현재·기본 설정, 레이아웃, 영역별 테마와 스크롤 설정을 구독합니다. 설정 hook으로 변경·초기화하면 관련 화면이 함께 갱신됩니다.':
    '설정 hook으로 현재 설정과 기본값을 읽고, 레이아웃·영역별 테마·스크롤 설정을 변경하거나 초기화합니다. 같은 설정을 사용하는 화면에도 변경 내용이 반영됩니다.',
  'Components useDiscardGuard는 영역별 변경을, Core usePageLeaveGuard는 페이지 이동을 보호합니다. 공통 UI와 페이지 이동의 역할을 직접 연결합니다.':
    'Components의 useDiscardGuard로 편집 영역에서 저장하지 않은 변경 내용을 버릴지 확인합니다. 페이지를 이동할 때 확인하려면 Core의 usePageLeaveGuard를 사용합니다. 필요한 화면에 각 hook을 직접 연결합니다.',
  'useSearchAction으로 검색 진행·취소를 추적하고 usePageLockLoading으로 공통 화면 잠금을 제어합니다. UI 프로바이더에서 요청 취소와 잠금 표시를 연결합니다.':
    'useSearchAction의 run·cancel로 조회를 실행하거나 취소하고, isRunning·isCanceling으로 진행 상태를 확인합니다. usePageLockLoading은 OwpUiProvider의 Backdrop을 통해 로딩 중 화면 조작을 막습니다.',
  '날짜 범위를 검색 키로 옮기고 값을 JSON body·문자열로 변환합니다. query·form 모드와 빈 값 처리 결과를 비교합니다.':
    '날짜 범위를 API 요청 필드로 변환하고, 입력값으로 JSON body나 JSON 문자열을 만듭니다. query·form 모드의 날짜 변환 방향과 빈 값 처리 결과를 비교합니다.',
  '파일·추가 필드를 FormData 업로드 변수로 구성하고 Blob을 ZIP으로 저장합니다. fetchFile·openFileBySeq는 프로젝트의 파일 API·인증 설정이 필요합니다.':
    '파일과 추가 필드로 업로드할 FormData를 구성하고, Blob 파일을 ZIP으로 묶어 다운로드합니다. fetchFile·openFileBySeq를 사용하려면 앱의 파일 API와 인증 정보를 설정해야 합니다.',
  'initOwpI18n과 언어 상태를 연결하고 API용 대문자 코드와 i18next용 소문자 코드를 확인합니다. useStorage의 환경 설정은 사용자 설정 저장과 별도로 관리합니다.':
    'initOwpI18n으로 언어를 초기화하고 언어 hook으로 현재 언어를 읽거나 변경합니다. API에 전달하는 대문자 언어 코드와 i18next에 전달하는 소문자 언어 코드를 확인합니다. useStorage의 환경 설정은 사용자 설정 저장과 별도로 관리합니다.',
  '독립 실행 범위가 필요할 때 공개 store·atom을 사용합니다. 테마 기본값과 상수는 설정 구성에 사용하며 페이지마다 store를 새로 만들 필요는 없습니다.':
    '별도 store가 필요한 경우 createOwpStore와 공개 atom을 사용합니다. 테마 기본값과 상수는 앱의 초기 설정에 사용합니다. 같은 store를 공유하는 페이지마다 새 store를 만들 필요는 없습니다.',
  '프로바이더는 페이지들이 같은 앱 환경·상태·요청 캐시·테마와 공통 UI를 사용하도록 실행 범위를 만듭니다. 앱 구성 예시의 AppProviders와 루트 App처럼 Router 바깥의 기반 구성과 Router 안의 화면 구성을 나눕니다.':
    'Core의 Provider는 각 페이지가 앱 환경·사용자 정보·설정·요청 cache·테마·공통 UI를 공유하도록 연결합니다. 예제에서는 AppProviders의 OwpCoreProvider·OwpStyleProvider가 RouterProvider를 감싸고, RouterProvider가 렌더링하는 루트 route element에 OwpUiProvider를 배치합니다.',
  'env에는 apiBaseUrl·accessTokenTransport·언어 사용 여부를, configs에는 routesConfig·navigationConfig·settingsConfig를 전달합니다. 이 범위에 독립 Jotai store와 QueryClient가 만들어집니다. queryClientConfig로 재시도·재조회 기본값을 정하거나 이미 생성한 queryClient를 전달할 수 있습니다. storePreloadedState는 지원하는 settings·navbar 초기 상태를 넣는 옵션입니다.':
    'env에는 apiBaseUrl·accessTokenTransport·언어 사용 여부를, configs에는 routesConfig·navigationConfig·settingsConfig를 전달합니다. OwpCoreProvider는 기본적으로 독립된 Jotai store와 QueryClient를 생성합니다. queryClientConfig로 재시도·재조회 기본값을 정하거나 이미 생성한 queryClient를 전달할 수 있습니다. storePreloadedState에는 settings·navbar의 초기값을 지정합니다.',
  'OwpCoreProvider 안에 OwpStyleProvider를 두면 현재 settings의 main 테마를 MUI에 제공합니다. 앱 최상위에는 root를 지정해 body class와 전역 스타일을 적용합니다. theme을 직접 전달하면 그 MUI theme이 우선하므로 Core 테마 변경과 동기화하려면 별도 처리가 필요합니다. Emotion cache는 cacheProviderProps.value를 전달한 경우에 연결합니다.':
    'OwpStyleProvider를 OwpCoreProvider의 child로 배치하면 현재 settings의 main 테마를 MUI에 제공합니다. 앱 전체에 적용하는 OwpStyleProvider에는 root를 지정해 body class와 전역 스타일을 적용합니다. theme prop을 직접 지정하면 해당 MUI theme이 우선하므로 Core 테마 변경도 반영하려면 앱에서 동기화해야 합니다. Emotion cache는 cacheProviderProps.value를 전달한 경우에 사용합니다.',
  'RouterProvider가 렌더하는 루트 route element 안에 OwpUiProvider를 배치합니다. 다이얼로그·snackbar·페이지 이탈 가드·화면 잠금과 query 취소 정책을 연결하며, queryCancellation.routeChange·pageExit는 기본 true입니다. useInitApp은 이 루트에서 로고·제목·navigation·페이지 로딩을 초기화합니다. Data Router가 필요한 정책을 사용하므로 OwpUiProvider를 RouterProvider 바깥이나 일반 MemoryRouter 아래에 두지 않습니다.':
    'RouterProvider가 렌더링하는 루트 route element에 OwpUiProvider를 배치합니다. 다이얼로그·snackbar·페이지 이동 확인·화면 잠금·query 취소를 처리하며, queryCancellation.routeChange·pageExit는 기본 true입니다. useInitApp은 루트 route 컴포넌트에서 호출해 로고·제목·navigation·페이지 로딩을 초기화합니다. OwpUiProvider에는 Data Router context가 필요합니다. RouterProvider의 상위나 일반 MemoryRouter의 child로 배치하면 이 context를 사용할 수 없습니다.',
  '아래 코드는 앱 구성 예시의 AppProviders → RouterProvider → App 내부 OwpUiProvider 순서를 최소 구성으로 옮긴 예제입니다. 빈 routesConfig·navigationConfig는 Core 메뉴를 만들지 않습니다. 예제의 실제 화면 경로는 createBrowserRouter에 직접 등록하며, 업무 앱에서는 자신의 route·navigation 설정과 페이지를 연결합니다.':
    '아래 예제에서 AppRoot는 AppProviders로 RouterProvider를 감쌉니다. AppProviders는 OwpCoreProvider·OwpStyleProvider를 렌더링하고, 루트 route의 PageRuntime은 OwpUiProvider를 렌더링합니다. 빈 routesConfig·navigationConfig는 Core 메뉴를 생성하지 않습니다. 화면 경로는 createBrowserRouter에 직접 등록하며, 실제 앱에서는 앱의 route·navigation 설정과 페이지를 연결합니다.',
  'Core는 앱 전체에서 공유하는 사용자·메뉴·설정 상태를 관리합니다. 페이지의 입력·선택 값은 React 로컬 상태에, 서버 조회 결과는 QueryClient 캐시에 두어 상태의 수명과 갱신 경로를 분명히 합니다.':
    'Core는 앱 전체에서 사용하는 사용자 정보·메뉴·설정을 store에 보관합니다. 페이지에서 입력하거나 선택한 값은 컴포넌트의 state로 관리하고, API 조회 결과는 QueryClient의 cache로 관리합니다.',
  'useGetCurrentUser·useGetNavigationList·useGetCurrentSettings로 필요한 상태를 구독합니다. 변경은 useApplyAuthenticatedUser·useSetNavigationList·useSetSettings 같은 공개 hook으로 수행합니다. OwpCoreProvider가 store를 제공하므로 페이지마다 새 OwpStoreProvider를 만들지 않습니다. 공개 atom이 필요한 경우에는 @owp/core/store를 사용하며 Jotai를 직접 import할 앱은 Jotai 의존성도 선언합니다.':
    'useGetCurrentUser·useGetNavigationList·useGetCurrentSettings로 각각 사용자 정보·메뉴·현재 설정을 가져옵니다. 이 값이 변경되면 hook을 사용하는 컴포넌트에도 반영됩니다. 변경할 때는 useApplyAuthenticatedUser·useSetNavigationList·useSetSettings를 사용합니다. OwpCoreProvider가 제공하는 store를 사용하므로 페이지마다 OwpStoreProvider를 추가하지 않습니다. 공개 atom은 @owp/core/store에서 가져옵니다. 앱에서 Jotai를 직접 import한다면 Jotai 의존성도 선언합니다.',
  'settings·navbar의 일반 변경은 메모리 상태이며 새로고침 후 자동 복원을 보장하지 않습니다. 반면 인증 정보와 navigation 등은 해당 hook이 storage와 연결합니다. store를 분리해도 브라우저 storage까지 분리되는 것은 아닙니다. 사용자별 설정 저장이 필요하면 앱이 저장 key·형식 검증·로그아웃 처리·초기화 이후 복원 시점을 정해야 합니다. useStorage의 getEnv·setEnv는 환경 설정 API로, 사용자 settings 저장 함수가 아닙니다.':
    'settings·navbar 변경은 메모리의 store에 반영되며 새로고침 후 자동 복원을 보장하지 않습니다. 인증 정보와 navigation 등은 관련 hook을 통해 storage에도 저장됩니다. store를 분리해도 같은 origin의 브라우저 storage까지 분리되지는 않습니다. 사용자별 설정을 저장하려면 앱에서 저장 key·데이터 형식 검증·로그아웃 시 처리·설정 초기화 후 복원 시점을 정해야 합니다. useStorage의 getEnv·setEnv는 환경 설정용 API이며 사용자 settings를 저장하는 함수가 아닙니다.',
  'Core는 프로바이더·상태 관리·API·테마를 연결하는 앱의 기반입니다. 프로바이더는 <strong>공유 실행 환경</strong>을 만들고, 상태 hook은 사용자·메뉴·설정을, API hook은 요청과 캐시를, 테마 설정은 앱의 공통 스타일을 관리합니다.':
    'Core는 프로바이더·상태 관리·API·테마를 연결하는 앱의 기반입니다. 프로바이더는 여러 화면이 같은 <strong>context와 store</strong>를 사용하도록 연결합니다. 상태 hook은 사용자·메뉴·설정을, API hook은 요청과 cache를, 테마 설정은 앱의 공통 스타일을 관리합니다.',
  '문서 메뉴의 프로바이더 구성 → 상태 관리 → API 설정 → 테마와 설정 순서로 각 기능의 역할·설정 방법·기대효과를 확인하세요. 아래에서는 설치와 전체 진입 코드를 확인할 수 있습니다.':
    '문서 메뉴에서 Provider 구성 → 사용자·메뉴·설정 관리 → API 설정 → 테마 설정 순서로 각 기능의 사용법을 확인하세요. 아래에는 설치 명령과 앱 초기화 코드가 있습니다.',
  'OwpUiProvider는 React Router Data Router 안에 배치하고, 페이지 이동 보호가 필요한 화면에서 usePageLeaveGuard를 호출합니다. Playground의 독립 예제는 서버 인증 없이 실행합니다.':
    'OwpUiProvider는 RouterProvider가 렌더링하는 route element에 배치합니다. 저장하지 않은 변경 내용이 있을 때 페이지 이동을 확인하려면 해당 페이지에서 usePageLeaveGuard를 호출합니다. Playground의 독립 예제는 서버 인증 없이 실행합니다.',
  '예제에는 MUI ThemeProvider와 CssBaseline이 포함되어 있습니다. 프로젝트에 같은 설정이 있다면 기존 Provider 아래에 OwpNumberField를 배치합니다.':
    '예제에는 MUI ThemeProvider와 CssBaseline이 포함되어 있습니다. 프로젝트에서 이미 같은 설정을 사용한다면 해당 ThemeProvider의 child 컴포넌트로 OwpNumberField를 렌더링합니다.',
  '필수 peer dependency는 React·React DOM 19, Material UI·MUI System 9, Emotion React·Styled 11입니다. 아래 명령은 Components {{version}}의 지원 범위를 사용합니다.':
    '필수 peer dependency는 React·React DOM 19, Material UI·MUI System 9, Emotion React·Styled 11입니다. 아래 설치 명령에는 Components {{version}}과 호환되는 버전 범위를 지정했습니다.',
  '검색과 페이지': '검색 페이지',
  '테마와 설정': '테마 설정',
  '오류와 복구': '오류 처리',
  '오류 처리와 복구': '오류 처리',
  '사용자·설정·메뉴 상태를 읽고 갱신해 여러 화면에서 같은 앱 상태를 공유합니다.':
    '사용자 정보·메뉴·앱 설정을 조회하고 변경하는 방법을 확인합니다.',
  '검색과 데이터 표시': '데이터 조회',
  '편집과 확인': '데이터 편집',
  '검색 조건과 결과 목록': '목록 검색',
  '편집 창과 미저장 내용 확인': '다이얼로그에서 편집하기',
  '페이지 제목과 본문 구성': '페이지 레이아웃',
  '연락처 입력과 확인': '연락처 입력',
  '업무 문구로 선택': '선택 항목 문구 지정',
  '기본 저장·form 제출·최대 크기 다이얼로그를 각각 엽니다.':
    '저장 버튼, form 제출, 최대 크기 옵션을 적용한 다이얼로그를 각각 엽니다.',
  '편집한 값을 저장하거나 닫을 때 저장하지 않은 내용을 버릴지 확인합니다.':
    '편집한 값을 저장합니다. 저장하지 않은 변경 내용이 있으면 창을 닫기 전에 버릴지 확인합니다.',
  '저장 버튼은 입력값을 반영하고 닫기 버튼은 미저장 변경을 확인합니다.':
    '저장 버튼은 입력값을 저장합니다. 닫기 버튼은 저장하지 않은 변경 내용이 있을 때 버릴지 확인합니다.',
};

import '../src/app/i18n';
import { i18next } from '@owp/core/i18n';
import { afterEach, describe, expect, it } from 'vitest';
import { displayPublicDescription } from '../src/features/public-api/descriptions';
import { apiRoles, publicApiSearchText } from '../src/features/public-api/roles';
import { parameterLabel } from '../src/playgrounds/components/api/parameter-label';
import { describeApiKind } from '../src/features/public-api/description-kind';
import { publicApiGroups } from '../src/features/public-api/types';
import { formatApiDescription, normalizeAppTerminology } from '../src/shared/i18n/reference-copy';
import { coreCatalog } from '../src/playgrounds/core/catalog';
import { formatKoreanGuidance } from '../src/shared/i18n/guidance-copy';

const translate = (key: string, values?: Readonly<Record<string, string>>) =>
  i18next.t(key, values);

afterEach(async () => {
  await i18next.changeLanguage('ko');
});

describe('공개 API의 표시 문구', () => {
  it.each([
    ['Enter를 누르세요. 변경을 확정하세요.', 'Enter를 눌러 주세요. 변경을 확정해 주세요.'],
    ['조회하세요. 전달하세요.', '조회해 주세요. 전달해 주세요.'],
    [
      '`전달하세요`와 {{확정하세요}}, "조회하세요"는 유지하고 결과를 확인하세요.',
      '`전달하세요`와 {{확정하세요}}, "조회하세요"는 유지하고 결과를 확인해 주세요.',
    ],
    [
      '안녕하세요, {{name}}님. isDirty는 true여야 합니다. 3초 후 false를 반환합니다.',
      '안녕하세요, {{name}}님. isDirty는 true여야 합니다. 3초 후 false를 반환합니다.',
    ],
  ])('안내 어미를 다듬고 코드·인용·조건을 보존한다: %s', (source, expected) => {
    expect(formatKoreanGuidance(source)).toBe(expected);
    expect(formatKoreanGuidance(expected)).toBe(expected);
  });

  it('역할을 짧게 설명하고 원본 API 설명을 보존한다', () => {
    const entry = {
      name: 'OwpDataGridExportExcelButton',
      kind: 'component' as const,
      modules: ['@owp/datagrid'],
      description: 'Grid 데이터를 Excel로 내려받고 Core provider 없이도 실패 알림 표시.',
    };
    expect(displayPublicDescription(entry, translate)).toBe('Excel 내려받기 버튼 컴포넌트');
    expect(entry.description).toContain('Core provider');
    expect(
      displayPublicDescription(
        { ...entry, name: 'OwpDataGridValidationErrorSource', kind: 'type' },
        translate,
      ),
    ).toBe('셀 검증 오류를 구분하는 타입');
    expect(publicApiSearchText(entry)).toContain('Excel 내려받기 버튼 컴포넌트');
    expect(publicApiSearchText(entry)).toContain('Core provider');
  });

  it('역할 뒤에 실제 종류를 표시하고 같은 종류를 중복해서 붙이지 않는다', async () => {
    const cases = [
      ['component', '버튼', '버튼 컴포넌트', '버튼 component'],
      ['hook', 'Grid 조회', 'Grid 조회 Hook', 'Grid 조회 Hook'],
      ['function', '행 ID 생성', '행 ID 생성 유틸', '행 ID 생성 utility'],
      ['class', 'Excel 문서 생성', 'Excel 문서 생성 클래스', 'Excel 문서 생성 class'],
      ['context', '앱 공통 상태', '앱 공통 상태 Context', '앱 공통 상태 Context'],
      ['value', '기본 여백', '기본 여백 값', '기본 여백 value'],
      ['type', '셀 검증 결과', '셀 검증 결과 타입', '셀 검증 결과 type'],
      ['asset', '패키지 스타일', '패키지 스타일 파일', '패키지 스타일 file'],
    ] as const;
    for (const language of ['ko', 'en']) {
      await i18next.changeLanguage(language);
      for (const [kind, role, korean, english] of cases) {
        const expected = language === 'ko' ? korean : english;
        expect(describeApiKind(role, kind, translate)).toBe(expected);
        expect(describeApiKind(expected, kind, translate)).toBe(expected);
      }
    }
  });

  it('종류·유형의 중복을 줄이고 종류 이름과 Props 설명도 검색한다', () => {
    expect(describeApiKind('차트 종류', 'type', translate)).toBe('차트 타입');
    expect(describeApiKind('셀 표시 유형', 'type', translate)).toBe('셀 표시 타입');
    expect(
      publicApiSearchText({ name: 'Unknown', description: '', modules: [], kind: 'hook' }),
    ).toContain('Hook');
    expect(
      publicApiSearchText({ name: 'OwpDataGridProps', description: '', modules: [], kind: 'type' }),
    ).toContain('데이터 Grid Props 타입');
  });

  it('원문 코드와 인용을 보존하고 익숙한 영어 기술 용어로 표시한다', () => {
    expect(
      normalizeAppTerminology('프로바이더의 훅에서 콜백을 등록하고 래퍼를 재수출합니다.'),
    ).toBe('Provider의 Hook에서 callback을 등록하고 wrapper를 re-export합니다.');
    expect(describeApiKind('Grid 조회 훅', 'hook', translate)).toBe('Grid 조회 Hook');
    const protectedCopy = '`훅` "프로바이더" \'재수출\' <code>콜백</code>';
    expect(normalizeAppTerminology(protectedCopy)).toBe(protectedCopy);
    const code = '```ts\nconst label = "훅";\n```';
    expect(normalizeAppTerminology(code)).toBe(code);
    expect(normalizeAppTerminology('{{콜백}}에 등록한 훅입니다.')).toBe(
      '{{콜백}}에 등록한 Hook입니다.',
    );
    expect(normalizeAppTerminology('@owp/core/hooks의 useStorage는 Hook입니다.')).toBe(
      '@owp/core/hooks의 useStorage는 Hook입니다.',
    );
    expect(formatApiDescription('프로바이더에서 콜백을 등록합니다.')).toBe(
      'Provider에서 callback을 등록합니다.',
    );
    expect(normalizeAppTerminology('캐시를 공유하고 툴팁에 시리즈를 표시합니다.')).toBe(
      'cache를 공유하고 Tooltip에 series를 표시합니다.',
    );
    expect(normalizeAppTerminology('데이터 계열입니다.')).toBe('데이터 계열입니다.');
    expect(
      normalizeAppTerminology('공개 atom과 공개 API를 사용하고 비공개 API는 제외합니다.'),
    ).toBe('public atom과 public API를 사용하고 비공개 API는 제외합니다.');
    const publicIdentifiers = '`공개 atom` "공개 API" <code>공개 타입</code> {{공개 API}}';
    expect(normalizeAppTerminology(publicIdentifiers)).toBe(publicIdentifiers);
    const identifiers = '`cache`와 `options.tooltip`, "캐시", {{툴팁}}';
    expect(normalizeAppTerminology(identifiers)).toBe(identifiers);
  });

  it('제목·출처·상수 분류를 한국어와 영어에서 일관되게 표시한다', async () => {
    expect(coreCatalog.find((entry) => entry.id === 'user-permissions')?.title).toBe(
      '사용자별 페이지 권한',
    );
    expect(publicApiGroups.find((group) => group.id === 'constants')?.label).toBe('Constants');
    expect(publicApiGroups.find((group) => group.id === 'values')?.label).toBe('Values');
    expect(i18next.t('프로바이더 구성')).toBe('Provider 구성');
    expect(i18next.t('다른 import 경로')).toBe('다른 import 경로');
    expect(i18next.t('호출 형식 {{number}}', { number: 2 })).toBe('Signature 2');
    expect(i18next.t('사용자와 페이지 권한')).toBe('사용자별 페이지 권한');
    expect(i18next.t('{{name}}의 API를 re-export합니다.', { name: 'chart.js' })).toBe(
      'chart.js의 API를 re-export합니다.',
    );
    await i18next.changeLanguage('en');
    expect(i18next.t('다른 import 경로')).toBe('Other import paths');
    expect(i18next.t('호출 형식 {{number}}', { number: 2 })).toBe('Signature 2');
    expect(i18next.t('사용자별 페이지 권한')).toBe('Page permissions by user');
    expect(i18next.t('{{name}}의 API를 re-export합니다.', { name: 'chart.js' })).toBe(
      'Re-exports an API from chart.js.',
    );
  });

  it.each([
    [
      'Provider가 없으면 콜백을 등록하지 않습니다. "원본입니다. Next" 문구와 `callback()`은 유지합니다.',
      'Provider가 없으면 callback을 등록하지 않습니다. "원본입니다. Next" 문구와 `callback()`은 유지합니다.',
    ],
    [
      '알림 내용을 다이얼로그에 표시하고 사용자가 확인할 수 있게 합니다.',
      '알림 내용을 다이얼로그에 표시하고 사용자가 확인할 수 있게 합니다.',
    ],
    [
      '차트 시리즈 표시 요소의 형태를 구분하는 상수입니다.',
      '차트 series 표시 요소의 형태를 구분하는 상수입니다.',
    ],
  ])('설명 문장의 종결·조건·인용을 유지한다: %s', (description, expected) => {
    expect(formatApiDescription(description)).toBe(expected);
    expect(
      displayPublicDescription(
        { name: 'CustomExample', description, modules: ['example'], kind: 'hook' },
        translate,
      ),
    ).toBe(expected);
    expect(
      displayPublicDescription(
        {
          name: 'CustomUtility',
          description: 'Returns the current value\n\nAdditional notes.',
          modules: ['example'],
          kind: 'function',
        },
        translate,
      ),
    ).toBe('Returns the current value');
  });

  it('간략 설명의 문체와 영문 번역을 통일한다', async () => {
    await i18next.changeLanguage('en');
    const mismatches: string[] = [];
    for (const [korean, english] of Object.values(apiRoles)) {
      expect(korean).not.toMatch(/[.!?]$|(?:습니다|입니다|한다|함|음)$/);
      if (i18next.t(korean) !== english)
        mismatches.push(`${korean}: ${i18next.t(korean)} / ${english}`);
    }
    expect(mismatches).toEqual([]);
  });

  it.each([
    ['__1', 'OwpDataGridCreateRowsOptions', '옵션'],
    ['{ prefix, getIdentity }', 'OwpDataGridCreateRowsOptions<T>', '옵션'],
    ['__0', '{ value: string }', '입력 객체'],
    ['{ value }', '{ value: string }', '입력 객체'],
    ['[start, end]', '[number, number]', '배열 인자'],
    ['rows', 'readonly Row[]', 'rows'],
  ])('내부 인자 이름 %s을 사용 목적에 맞게 표시한다', (name, type, expected) => {
    expect(parameterLabel({ name, type }, (key) => key)).toBe(expected);
  });
});

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type VerifiedDefaults = Readonly<Record<string, Readonly<Record<string, string>>>>;

const gridFiles = {
  'dist/index.js': 'c81ba0607dc3a73228618c1d534b348af8b93ec74c4e6b9294c29b28449d3b67',
  'dist/chunks/C8z2ndwY.js': 'de83161ff79c79adf5093200a3b857248ef5ad4cb15fe396c296ac1e68e90afd',
  'dist/chunks/COyRmcMd.js': '3273e18e07abb024b1d2c97915f050b42345b7bd276d5b36e351fedf5732e5d9',
} as const;
const verifiedGridFiles: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  '4.0.0': gridFiles,
  '4.0.1': gridFiles,
  '4.0.2': { ...gridFiles, 'dist/index.js': 'ef72d50068fc60bda6590ca205b912c32fcfd07cb3dd0bfc0481ff5640c92623' },
};

export function verifiedComponentDefaults(root: string, packageId: string, version: string): VerifiedDefaults {
  // 버전별 버튼·export helper와 streaming·buffered 파일명 helper를 검토한 SHA-256입니다.
  if (packageId !== 'datagrid' || !Object.hasOwn(verifiedGridFiles, version)) return {};
  const files = verifiedGridFiles[version];
  if (!files) return {};
  for (const [relative, expected] of Object.entries(files)) {
    const file = resolve(root, 'node_modules/@owp/datagrid', relative);
    if (!existsSync(file) || createHash('sha256').update(readFileSync(file)).digest('hex') !== expected) return {};
  }
  // Excel 버튼이 옵션을 그대로 전달하는 경로를 설치본에서 확인한 값입니다.
  // 파일명 helper의 ?? "sheet"·날짜 suffix 조건, 내보내기 함수의 saveMode 분기를 확인합니다.
  // 버전과 세 구현 파일이 모두 일치할 때만 적용하며, 변경된 설치본에는 전파하지 않습니다.
  return {
    OwpDataGridExportExcelButton: {
      exportName: '"sheet"',
      useAppendCurrentDateTimeToExportName: 'false',
      saveMode: '"auto"',
    },
  };
}

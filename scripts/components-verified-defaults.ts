import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type VerifiedDefaults = Readonly<Record<string, Readonly<Record<string, string>>>>;

const gridFiles = {
  'dist/index.js': 'ea77188e5a0a79e8b3c9fca8ff00fbc6c9363116358a05bc402f673b3a84e839',
  'dist/chunks/C8z2ndwY.js': 'de83161ff79c79adf5093200a3b857248ef5ad4cb15fe396c296ac1e68e90afd',
};

export function verifiedComponentDefaults(root: string, packageId: string, version: string): VerifiedDefaults {
  if (packageId !== 'datagrid' || version !== '3.5.4') return {};
  for (const [relative, expected] of Object.entries(gridFiles)) {
    const file = resolve(root, 'node_modules/@owp/datagrid', relative);
    if (!existsSync(file) || createHash('sha256').update(readFileSync(file)).digest('hex') !== expected) return {};
  }
  // Excel 버튼이 옵션을 그대로 전달하는 경로를 설치본에서 확인한 값입니다.
  // 파일명 helper의 ?? "sheet"·날짜 suffix 조건, 내보내기 함수의 saveMode 분기를 확인합니다.
  // 버전과 두 구현 파일이 모두 일치할 때만 적용하며, 변경된 설치본에는 전파하지 않습니다.
  return {
    OwpDataGridExportExcelButton: {
      exportName: '"sheet"',
      useAppendCurrentDateTimeToExportName: 'false',
      saveMode: '"auto"',
    },
  };
}

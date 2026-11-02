declare module 'virtual:components-api-data' {
  // oxlint-disable-next-line typescript/consistent-type-imports -- ambient 모듈에서는 상대 경로의 타입을 import()로 참조합니다.
  export const componentsApiData: import('./types').ComponentsApiData;
}

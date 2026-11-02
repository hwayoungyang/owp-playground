// oxlint-disable typescript/consistent-type-imports -- Ambient virtual module에서 상대 경로 타입을 참조하며 module augmentation을 만들지 않습니다.
declare module 'virtual:public-api/index' {
  const data: import('./types').PublicApiIndex;
  export default data;
}
declare module 'virtual:public-api/*' {
  const data: import('./types').PublicApiPackageData;
  export default data;
}

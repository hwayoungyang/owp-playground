import type { ComponentsApiPropsVariant } from '../src/playgrounds/components/api/types.ts';

export function labelPropsVariants(variants: readonly ComponentsApiPropsVariant[]): readonly ComponentsApiPropsVariant[] {
  const unique = [...new Map(variants.map((variant) => [JSON.stringify(variant.props), variant])).values()];
  if (unique.length === 1) return unique.map((variant) => ({ ...variant, label: 'Props' }));
  return unique.map((variant) => {
    const prop = (name: string) => variant.props.find((member) => member.name === name);
    const required = (name: string) => prop(name)?.requirement === 'required';
    let label: string;
    if (required('api') && prop('dataGridRef')) label = 'Grid API 연결';
    else if (required('dataGridRef') && prop('api')) label = 'Grid ref 연결';
    else if (prop('layout') && prop('cellLayout')) {
      const layout = required('cellLayout') ? '매트릭스 배치' : '필드 쌍 배치';
      label = `${layout} · ${required('dateFormatter') ? '날짜 포맷 사용' : '날짜 포맷 미사용'}`;
    } else if (prop('selectorType') && prop('valueKey') && prop('labelKey')) {
      label = [prop('selectorType')?.type === '"autocomplete"' ? 'Autocomplete' : 'Select', required('valueKey') ? 'valueKey' : 'valueResolver', required('labelKey') ? 'labelKey' : 'labelResolver'].join(' · ');
    } else if (prop('showMonthYearDropdown')) label = required('showMonthYearDropdown') ? '월·연도 통합 선택' : '기본 달력';
    else if (prop('initialSeries') && prop('liveRef')) label = required('initialSeries') ? '데이터 누적 (append)' : '외부 데이터 연결 (controlled)';
    else if (prop('variant')?.type === '"filled"') label = 'Filled 입력';
    else if (prop('variant')?.type === '"outlined"') label = 'Outlined 입력';
    else if (prop('variant')?.type === '"standard" | undefined') label = 'Standard 입력';
    else if (required('href')) label = '링크 탭';
    else if (required('component')) label = '사용자 지정 컴포넌트';
    else if (required('src')) label = 'src로 이미지 지정';
    else if (required('source')) label = 'source로 이미지 지정';
    else if (required('x') && required('y')) label = 'SVG 텍스트';
    else if (unique.some((candidate) => candidate.props.some((member) => member.name === 'x' && member.requirement === 'required'))) label = '문서 텍스트';
    else if (unique.some((candidate) => candidate.props.some((member) => member.name === 'href' || member.name === 'component'))) label = '기본 탭';
    else label = variant.props.filter((member) => member.requirement === 'required').map((member) => member.name).join(' · ') || variant.declaration;
    return { ...variant, label };
  });
}

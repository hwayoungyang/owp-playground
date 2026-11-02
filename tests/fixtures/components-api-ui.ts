import type {
  ComponentsApiData,
  ComponentsApiEntry,
  ComponentsApiMember,
} from '../../src/playgrounds/components/api/types';

const baseEntry = {
  description: '',
  declaration: '',
  propsVariants: [],
  signatures: [],
  valueType: null,
  relatedTypeIds: [],
  exampleIds: [],
} as const;
const baseProp = {
  source: '@owp/components',
  requirement: 'optional',
  description: '',
  defaultValue: null,
  isCallback: false,
} as const;
const props: readonly ComponentsApiMember[] = [
  {
    ...baseProp,
    name: 'value',
    type: 'string',
    requirement: 'required',
    description: 'Original value description.',
    defaultValue: "''",
  },
  { ...baseProp, name: 'changed', type: '(value: string) => void', isCallback: true },
  { ...baseProp, name: 'onLabel', type: 'string' },
  { ...baseProp, name: 'ref', type: 'Ref<HTMLInputElement>' },
  { ...baseProp, name: 'multiple', type: 'never', requirement: 'unavailable' },
  {
    ...baseProp,
    name: 'size',
    type: '"small" | "medium"',
    source: '@mui/material',
    defaultValue: '"medium"',
  },
];
export const componentsApiUiFixture = {
  packageVersion: '4.0.1',
  entries: [
    {
      ...baseEntry,
      id: 'OwpNumberField',
      name: 'OwpNumberField',
      group: 'components',
      kind: 'component',
      description: '숫자 입력의 원문 설명입니다.',
      imports: ["import { OwpNumberField } from '@owp/components';"],
      declaration: 'declare const OwpNumberField: NumberField;',
      propsVariants: [
        { label: 'single', declaration: '{ value: string; multiple?: never; }', props },
        {
          label: 'multiple',
          declaration: '{ value: string[]; multiple: true; }',
          props: [{ ...baseProp, name: 'value', type: 'string[]', requirement: 'conditional' }],
        },
      ],
      relatedTypeIds: ['NumberFieldInfo'],
      exampleIds: ['number-field'],
    },
    {
      ...baseEntry,
      id: 'useExample',
      name: 'useExample',
      group: 'hooks',
      kind: 'hook',
      imports: ["import { useExample } from '@owp/components/hooks';"],
      declaration: 'declare function useExample(options?: Options): Result;',
      signatures: [
        {
          declaration: 'useExample(options?: Options): Result',
          returnType: 'Result',
          returnDescription: 'Original return description.',
          parameters: [
            {
              name: 'options',
              type: 'Options',
              optional: true,
              rest: false,
              description: 'Original parameter description.',
            },
          ],
        },
        {
          declaration: 'useExample(): null',
          parameters: [],
          returnType: 'null',
          returnDescription: '',
        },
      ],
    },
    {
      ...baseEntry,
      id: 'mergeExample',
      name: 'mergeExample',
      group: 'utils',
      kind: 'function',
      description: 'Combines style values.',
      imports: ["import { mergeExample } from '@owp/components/utils';"],
      signatures: [
        {
          declaration: 'mergeExample(...styles: Style[]): Style',
          returnType: 'Style',
          returnDescription: '',
          parameters: [
            { name: 'styles', type: 'Style[]', optional: false, rest: true, description: '' },
          ],
        },
      ],
    },
    {
      ...baseEntry,
      id: 'responsiveLayoutStyles',
      name: 'responsiveLayoutStyles',
      group: 'utils',
      kind: 'value',
      imports: ["import { responsiveLayoutStyles } from '@owp/components/utils';"],
      valueType: 'Readonly<LayoutStyles>',
      declaration: 'declare const responsiveLayoutStyles: Readonly<LayoutStyles>;',
    },
  ] satisfies readonly ComponentsApiEntry[],
  supportingTypes: [
    {
      id: 'NumberFieldInfo',
      name: 'NumberFieldInfo',
      imports: [],
      description: 'Original supporting type description.',
      declaration: 'interface NumberFieldInfo { source: "event" | "prop"; }',
    },
  ],
} satisfies ComponentsApiData;

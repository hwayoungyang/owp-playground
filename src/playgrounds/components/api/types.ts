export type ComponentsApiGroup = 'components' | 'hooks' | 'utils';

export type ComponentsApiMember = {
  readonly name: string;
  readonly type: string;
  readonly requirement: 'required' | 'optional' | 'conditional' | 'unavailable';
  readonly description: string;
  readonly defaultValue: string | null;
  readonly source: string;
  readonly isCallback: boolean;
};

export type ComponentsApiPropsVariant = {
  readonly label: string;
  readonly declaration: string;
  readonly props: readonly ComponentsApiMember[];
};

export type ComponentsApiParameter = {
  readonly name: string;
  readonly type: string;
  readonly optional: boolean;
  readonly rest: boolean;
  readonly description: string;
};

export type ComponentsApiSignature = {
  readonly declaration: string;
  readonly parameters: readonly ComponentsApiParameter[];
  readonly returnType: string;
  readonly returnDescription: string;
};

export type ComponentsApiEntry = {
  readonly id: string;
  readonly name: string;
  readonly group: ComponentsApiGroup;
  readonly kind: 'component' | 'hook' | 'function' | 'value';
  readonly imports: readonly string[];
  readonly description: string;
  readonly declaration: string;
  readonly propsVariants: readonly ComponentsApiPropsVariant[];
  readonly signatures: readonly ComponentsApiSignature[];
  readonly valueType: string | null;
  readonly relatedTypeIds: readonly string[];
  readonly exampleIds: readonly string[];
};

export type ComponentsApiSupportingType = {
  readonly id: string;
  readonly name: string;
  readonly imports: readonly string[];
  readonly description: string;
  readonly declaration: string;
};

export type ComponentsApiData = {
  readonly packageVersion: string;
  readonly entries: readonly ComponentsApiEntry[];
  readonly supportingTypes: readonly ComponentsApiSupportingType[];
};

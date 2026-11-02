import ts from 'typescript-compiler-api';
import type {
  ComponentsApiMember,
  ComponentsApiPropsVariant,
  ComponentsApiSignature,
} from '../src/playgrounds/components/api/types.ts';
import { ComponentsApiError, symbolDeclaration } from './components-api-compiler.ts';
import { labelPropsVariants } from './components-api-variants.ts';
import { documentedDefault } from './components-api-default-docs.ts';
import {
  documentation,
  memberSource,
  parameterDocumentation,
  readableType,
  tagText,
} from './components-api-text.ts';

export function callableSignatures(type: ts.Type): readonly ts.Signature[] {
  return type.getCallSignatures();
}

export function readSignatures(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
): readonly ComponentsApiSignature[] {
  const declaration = symbolDeclaration(symbol);
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  return callableSignatures(type).map((signature) => {
    const location = signature.getDeclaration() ?? declaration;
    return {
      declaration: checker.signatureToString(
        signature,
        declaration,
        ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
      ),
      parameters: signature.parameters.map((parameter) => {
        const parameterDeclaration = symbolDeclaration(parameter);
        return {
          name: ts.isParameter(parameterDeclaration)
            ? parameterDeclaration.name.getText()
            : parameter.name,
          type: readableType(
            checker,
            checker.getTypeOfSymbolAtLocation(parameter, location),
            location,
          ),
          optional:
            Boolean(parameter.flags & ts.SymbolFlags.Optional) ||
            (ts.isParameter(parameterDeclaration) &&
              Boolean(parameterDeclaration.questionToken || parameterDeclaration.initializer)),
          rest:
            ts.isParameter(parameterDeclaration) && Boolean(parameterDeclaration.dotDotDotToken),
          description:
            documentation(checker, parameter) ||
            parameterDocumentation(signature.getJsDocTags(), parameter.name) ||
            parameterDocumentation(symbol.getJsDocTags(checker), parameter.name),
        };
      }),
      returnType: readableType(checker, signature.getReturnType(), location),
      returnDescription:
        tagText(signature.getJsDocTags(), 'returns') ||
        tagText(symbol.getJsDocTags(checker), 'returns'),
    };
  });
}

function isUnavailable(type: ts.Type, declaration: ts.Declaration): boolean {
  return (
    Boolean(type.flags & ts.TypeFlags.Never) ||
    (ts.isPropertySignature(declaration) && declaration.type?.kind === ts.SyntaxKind.NeverKeyword)
  );
}

export function readMember(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  owner: ts.Symbol,
): ComponentsApiMember {
  // Mapped type가 만든 property는 개별 선언 없이 owner의 문맥에서 해석됩니다.
  const declaration =
    symbol.valueDeclaration ?? symbol.declarations?.[0] ?? symbolDeclaration(owner);
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const tags = symbol.getJsDocTags(checker);
  const unavailable = isUnavailable(type, declaration);
  const callableTypes = checker.getNonNullableType(type);
  return {
    name: symbol.name,
    type: unavailable ? 'never' : readableType(checker, type, declaration),
    requirement: unavailable
      ? 'unavailable'
      : symbol.flags & ts.SymbolFlags.Optional
        ? 'optional'
        : 'required',
    description:
      documentation(checker, symbol) ||
      parameterDocumentation(owner.getJsDocTags(checker), symbol.name),
    defaultValue: unavailable ? null : tagText(tags, 'default') || tagText(tags, 'defaultValue') || documentedDefault(documentation(checker, symbol), readableType(checker, type, declaration)),
    source: memberSource(declaration),
    isCallback:
      !unavailable &&
      (callableTypes.isUnion() ? callableTypes.types : [callableTypes]).some(
        (branch) => branch.getCallSignatures().length > 0,
      ),
  };
}

export function componentPropsTypes(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
): readonly ts.Type[] {
  const declaration = symbolDeclaration(symbol);
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const calls = type.getCallSignatures();
  if (calls.length > 0)
    return calls.flatMap((signature) => {
      const parameter = signature.parameters[0];
      if (!parameter) return [];
      const props = checker.getTypeOfSymbolAtLocation(
        parameter,
        signature.getDeclaration() ?? declaration,
      );
      return props.isUnion() ? props.types : [props];
    });
  const constructors = type.getConstructSignatures();
  if (constructors.length > 0)
    return constructors.flatMap((signature) => {
      const props = signature.getReturnType().getProperty('props');
      if (!props) throw new ComponentsApiError(`${symbol.name} class의 props를 찾을 수 없습니다.`);
      const propsType = checker.getTypeOfSymbolAtLocation(props, declaration);
      return propsType.isUnion() ? propsType.types : [propsType];
    });
  throw new ComponentsApiError(`${symbol.name}의 component 호출 계약을 해석할 수 없습니다.`);
}

export function readPropsVariants(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
): readonly ComponentsApiPropsVariant[] {
  const types = componentPropsTypes(checker, symbol);
  const declaration = symbolDeclaration(symbol);
  // 각 branch가 실제로 선언한 property와 필수 여부를 보존합니다.
  return labelPropsVariants(types.map((type) => {
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown))
      throw new ComponentsApiError(`${symbol.name}의 props 타입을 해석할 수 없습니다.`);
    return {
      label: 'Props',
      declaration: readableType(checker, type, declaration),
      props: type.getProperties().map((property) => readMember(checker, property, symbol)),
    };
  }));
}

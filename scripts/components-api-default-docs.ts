/** 명시된 기본값만 읽으며 optional 여부로 값을 추정하지 않습니다. */
export function documentedDefault(description: string, type: string): string | null {
  const defaults = [...description.matchAll(/(?:기본값(?:은|는)?\s*[:：]?\s*|defaults?\s+to\s+)(`[^`]+`|"[^"]*"|'[^']*'|[^\s,;。)]+)/gi)];
  const values = defaults.map((match) => {
    const value = match[1]?.replace(/\.$/, '').replace(/^`|`$/g, '').replace(/^(true|false)(?:이며|이고|입니다|로|가|는|은).*$/, '$1');
    if (!value) return null;
    if (/^(?:true|false|null|undefined|NaN|Infinity|-?\d+(?:\.\d+)?|\[\]|\{\}|"[^"]*"|'[^']*')$/.test(value)) return value;
    return type.includes(`"${value}"`) ? JSON.stringify(value) : null;
  });
  if (new Set(values).size > 1) {
    const conditional = defaults.map((match, index) => {
      const context = description.slice(0, match.index).split(/[.,;\n]/).at(-1)?.trim();
      return context && values[index] ? `${context}: ${values[index]}` : null;
    });
    return conditional.every((value) => value !== null) ? conditional.join(' · ') : null;
  }
  const value = values[0];
  return value ?? null;
}

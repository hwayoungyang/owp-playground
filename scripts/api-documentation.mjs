/** JSDoc 본문과 block tag를 분리하고 원문은 인용·검색용으로 유지합니다. */
export function parseDocumentation(raw) {
  const prose = [];
  const tags = [];
  for (const line of raw.split('\n')) {
    const match = line.match(/^\s*@([\w-]+)\b\s*(.*)$/);
    if (match) tags.push({ name: match[1], text: match[2] });
    else if (tags.length) tags.at(-1).text += `\n${line}`;
    else prose.push(line);
  }
  for (const tag of tags) tag.text = tag.text.trim();
  const description = prose.join('\n').trim();
  const tagged = tags.find((tag) => ['default', 'defaultValue'].includes(tag.name));
  let value = tagged?.text ?? null;
  let note = null;
  if (!tagged) {
    const line = description.split('\n').find((entry) => /기본값|\b[Dd]efault(?: value)?:/.test(entry));
    const korean = line?.match(/기본값\s*[:=]?\s+([A-Za-z_$][\w$]*(?::[\w]+)*|-?\d+(?:\.\d+)?)(?=[),]|\.(?!\d)|$)/);
    const english = line?.match(/\b[Dd]efault(?: value)?:\s*(.+)/);
    value = korean?.[1] ?? english?.[1] ?? line ?? null;
    // Prose such as "(default: flat grid)" has a wrapping parenthesis, unlike a function call default.
    if (english && /\(default(?: value)?:/i.test(line) && value.endsWith(')')) value = value.slice(0, -1);
  }
  if (tagged && value) {
    const annotated = value.match(/^((?:true|false|null|undefined|-?\d+(?:\.\d+)?|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"))\s+(\([\s\S]*\)|\/\/[^\n]*)$/);
    const comment = value.match(/^([^\n]+?)\s+\/\/\s*(.+)$/);
    if (annotated) { value = annotated[1]; note = annotated[2]; }
    else if (comment) { value = comment[1]; note = comment[2]; }
  }
  return { description, documentation: raw, docTags: tags, defaultDescription: value, defaultNote: note };
}

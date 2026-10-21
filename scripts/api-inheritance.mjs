import { bindTypeArguments, substituteType } from './api-type-substitution.mjs';

/** Utility type과 generic 상속을 적용하고 선언 원문·출처를 유지합니다. */
export function inheritApiMembers(records) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const done = new Set();
  const joinSignatures = (values) => [...new Set(values)].map((value) => value.includes('=>') ? `(${value})` : value).join(' | ');
  function expand(record, visiting = new Set()) {
    if (done.has(record.id) || visiting.has(record.id)) return;
    visiting.add(record.id);
    for (const base of record.bases ?? []) {
      const parent = byId.get(base.id);
      if (!parent) continue;
      expand(parent, visiting);
      const bindings = bindTypeArguments(parent.typeParameters ?? [], base.arguments);
      if (!record.related.includes(base.id)) record.related.push(base.id);
      for (const member of [...byId.values()].filter((entry) => entry.package === parent.package && entry.owner === parent.owner && entry.path)) {
        const key = member.path.split('.')[0];
        if (base.omit.includes(key) || base.pick.length > 0 && !base.pick.includes(key)) continue;
        const id = `${record.id}.${member.path}`;
        const optional = base.required ? false : base.partial || member.optional;
        const inherited = { ...member, id, package: record.package, packageVersion: record.packageVersion, owner: record.owner, imports: record.imports, declaredIn: member.id, inheritedFrom: [member.id], declarationSignature: member.declarationSignature ?? member.signature, signature: substituteType(member.signature, bindings), typeArguments: base.arguments, typeParameters: record.typeParameters, typeReferences: { ...member.typeReferences, ...record.typeReferences }, optional, requirement: base.conditional ? 'conditional' : base.required ? 'required' : base.partial ? 'optional' : member.requirement, related: [...new Set([...member.related, member.id])] };
        const previous = byId.get(id);
        if (!previous) byId.set(id, inherited);
        else if (previous.declaredIn) {
          const isUnion = Boolean(base.conditional && previous.requirement === 'conditional');
          const references = { ...previous.typeReferences, ...inherited.typeReferences };
          const conflicts = [...new Set([...(previous.typeReferenceConflicts ?? []), ...(inherited.typeReferenceConflicts ?? []), ...Object.keys(previous.typeReferences ?? {}).filter((name) => inherited.typeReferences?.[name] && previous.typeReferences[name] !== inherited.typeReferences[name])])];
          for (const name of conflicts) delete references[name];
          const merge = (values) => isUnion ? joinSignatures(values) : [...new Set(values)].map((value) => `(${value})`).join(' & ');
          const mergedOptional = isUnion ? previous.optional || inherited.optional : previous.optional && inherited.optional;
          byId.set(id, { ...previous, description: previous.description === inherited.description ? previous.description : '', signature: merge([previous.signature, inherited.signature]), declarationSignature: merge([previous.declarationSignature, inherited.declarationSignature]), optional: mergedOptional, requirement: isUnion || previous.requirement === 'conditional' || inherited.requirement === 'conditional' ? 'conditional' : mergedOptional ? 'optional' : 'required', inheritanceKind: isUnion ? 'union' : 'intersection', inheritedFrom: [...new Set([...previous.inheritedFrom, member.id])], related: [...new Set([...previous.related, ...inherited.related])], typeReferences: references, typeReferenceConflicts: conflicts });
        }
      }
    }
    visiting.delete(record.id);
    done.add(record.id);
  }
  for (const record of records.filter((entry) => !entry.path)) expand(record);
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

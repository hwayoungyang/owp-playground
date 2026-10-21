import { z } from 'zod';
import { locateExampleCode } from './api-example-locations.mjs';

const sourcePath = z.string().regex(/^playgrounds\/(datagrid|charts)\/[\w/-]+\.tsx?$/);
const anchor = z.object({ file: sourcePath, snippet: z.string().trim().min(1) }).strict();
const identity = {
  exampleId: z.string().min(1), apiId: z.string().min(1), label: z.string().min(1),
  reason: z.string().min(1), evidence: z.array(anchor).min(1),
};
const located = { mode: z.enum(['direct', 'forwarded']), file: sourcePath, snippet: z.string().trim().min(1) };
const reviewSchema = z.discriminatedUnion('action', [
  z.object({ ...identity, action: z.literal('locate'), ...located }).strict(),
  z.object({ ...identity, action: z.literal('replace'), ...located, replacement: z.object({ id: z.string().min(1), label: z.string().min(1) }).strict() }).strict(),
  z.object({ ...identity, action: z.literal('remove') }).strict(),
  z.object({ ...identity, action: z.literal('unlocated') }).strict(),
]);
const reviewKey = (exampleId, label) => `${exampleId}/${label}`;

/** 수동 검토 결론과 실제 소스 지문을 함께 검사함. */
export function createExampleCodeReviews(input, fingerprints) {
  const sources = z.record(sourcePath, z.string().regex(/^[a-f0-9]{64}$/)).parse(fingerprints);
  const reviews = new Map();
  for (const [packageId, entries] of Object.entries(input)) for (const review of z.array(reviewSchema).parse(entries)) {
    const key = `${packageId}/${reviewKey(review.exampleId, review.label)}`;
    if (reviews.has(key)) throw new ReferenceError(`중복 예제 코드 검토: ${key}`);
    reviews.set(key, review);
  }
  const consumed = new Set();
  return {
    resolve({ example, files, records, evidenceFiles = files }) {
      const lookup = new Map(files.map((file) => [file.file.replace(/^\/src\//, ''), file]));
      const evidenceLookup = new Map(evidenceFiles.map((file) => [file.file.replace(/^\/src\//, ''), file]));
      const resolveAnchor = ({ file, snippet }, forEvidence = false) => {
        const source = (forEvidence ? evidenceLookup : lookup).get(file);
        if (!source || !file.startsWith(`playgrounds/${example.packageId}/`)) throw new ReferenceError(`예제 의존 경로 밖의 코드 검토: ${example.id}/${file}`);
        if (sources[file] !== source.sha256) throw new ReferenceError(`예제 소스가 검토본과 다릅니다: ${file}`);
        const start = source.content.indexOf(snippet);
        if (start < 0 || source.content.indexOf(snippet, start + 1) >= 0) throw new ReferenceError(`예제 코드 검토 위치가 없거나 중복됩니다: ${example.id}/${file}`);
        const line = source.content.slice(0, start).split('\n').length;
        const endLine = source.content.slice(0, start + snippet.length).split('\n').length;
        if (endLine - line > 15) throw new RangeError(`예제 코드 검토 범위가 너무 깁니다: ${example.id}/${file}`);
        return { file, line, endLine, sha256: source.sha256 };
      };
      const decisions = [];
      const references = example.references.flatMap((reference) => {
        const key = `${example.packageId}/${reviewKey(example.id, reference.label)}`;
        const review = reviews.get(key);
        if (!review) return [{ ...reference, location: reference.location ?? locateExampleCode(records.get(reference.id), reference.label, files), codeReview: { method: 'ast' } }];
        consumed.add(key);
        if (review.apiId !== reference.id) throw new ReferenceError(`예제 API가 검토본과 다릅니다: ${key}`);
        const evidence = review.evidence.map((anchor) => resolveAnchor(anchor, true));
        const decision = { label: reference.label, id: reference.id, action: review.action, reason: review.reason, evidence };
        switch (review.action) {
          case 'remove':
            decisions.push(decision);
            return [];
          case 'unlocated': {
            decisions.push(decision);
            return [{ ...reference, location: null, codeReview: { method: 'reviewed', reason: review.reason, evidence } }];
          }
          case 'replace':
          case 'locate': {
            const target = review.action === 'replace' ? review.replacement : reference;
            const record = records.get(target.id);
            if (!record) throw new ReferenceError(`검토한 예제 API 선언이 없습니다: ${key}/${target.id}`);
            const location = resolveAnchor(review);
            decisions.push({ ...decision, target: { label: target.label, id: target.id }, location });
            return [{ label: target.label, id: target.id, packageId: record.package === '@owp/datagrid' ? 'datagrid' : 'charts', location, codeReview: { method: 'reviewed', mode: review.mode, reason: review.reason, evidence } }];
          }
          default:
            throw new TypeError(`알 수 없는 예제 코드 검토: ${key}`);
        }
      });
      if (new Set(references.map((reference) => reference.label)).size !== references.length) throw new ReferenceError(`검토 후 예제 API label 중복: ${example.id}`);
      return { references, referenceReviews: decisions };
    },
    assertComplete() {
      const unused = [...reviews.keys()].filter((key) => !consumed.has(key));
      if (unused.length) throw new ReferenceError(`현재 예제에서 찾을 수 없는 코드 검토: ${unused.join(', ')}`);
    },
  };
}

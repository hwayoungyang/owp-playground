import data from '../../src/features/api/data/knowledge.generated.json';
import { createApiDataset } from '../../src/features/api/model/knowledge';
import { referencePackagesFor } from '../../src/playgrounds/packages';
import { createPackageKnowledge } from '../../src/features/api/model/package-data';
import { knowledgeSchema, packageKnowledgeSchema } from '../../src/features/api/model/schema';

export const knowledge = knowledgeSchema.parse(data);
export const recordsById = new Map(knowledge.records.map((record) => [record.id, record]));

export function packageRecords(packageId: string) {
  return knowledge.records.filter(
    (record) =>
      record.package === `@owp/${packageId}` ||
      (referencePackagesFor(packageId).includes(record.package) &&
        Object.hasOwn(knowledge.dependencies, record.package)),
  );
}

export function packageDataset(packageId: string) {
  const entry = data.packages.find((entry) => entry.id === packageId);
  if (!entry) throw new TypeError(`Missing package fixture: ${packageId}`);
  return createApiDataset(packageKnowledgeSchema.parse(createPackageKnowledge(data, entry)));
}

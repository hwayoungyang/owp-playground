import type { SampleId } from '../catalog';
import { sampleDefinitions } from './components';
import { translateDefinition } from './localize';
import type { Definition } from './types';

export function getDefinition(id: SampleId, language = 'ko'): Definition {
  return translateDefinition(sampleDefinitions[id], language);
}

import type { GridExampleId } from '../catalog';
import { gridRegistry } from './gridRegistry';
import type { GridConfiguration } from './gridTypes';
import { translateGridConfiguration } from './localize';

export function getGridConfiguration(id: GridExampleId, language = 'ko'): GridConfiguration {
  return translateGridConfiguration(gridRegistry[id].configuration, language);
}

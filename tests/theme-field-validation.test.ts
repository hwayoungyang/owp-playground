import { describe, expect, it } from 'vitest';
import { dataGridThemeSchema, opacityRange } from '../src/features/theme-studio/model/schemas';
import { themeFieldMessage } from '../src/features/theme-studio/model/validation';
import { appEnglish } from '../src/shared/i18n/app.en';

describe('theme field validation feedback', () => {
  it.each([-1, 2, 'invalid'])('reports the opacity range when the input is %s', (value) => {
    // Given
    const parsed = dataGridThemeSchema.safeParse({ filter: { disabledOpacity: value } });
    if (parsed.success) throw new Error('Expected invalid opacity');

    // When
    const message = themeFieldMessage(parsed.error);

    // Then
    expect(message.options).toEqual(opacityRange);
    expect(appEnglish[message.key]).toBeTruthy();
  });

  it('reports the schema limit when an animation duration exceeds the maximum', () => {
    // Given
    const parsed = dataGridThemeSchema.safeParse({ motion: { interactionDuration: 5001 } });
    if (parsed.success) throw new Error('Expected an invalid duration');

    // When
    const message = themeFieldMessage(parsed.error);

    // Then
    expect(message.options).toEqual({ max: '5000' });
    expect(appEnglish[message.key]).toBeTruthy();
  });

  it('distinguishes palette-enabled overlay fields from plain color fields', () => {
    // Given
    const plain = dataGridThemeSchema.safeParse({ overlay: { noDataColor: 'invalid' } });
    const palette = dataGridThemeSchema.safeParse({ overlay: { errorColor: 'invalid' } });
    if (plain.success || palette.success) throw new Error('Expected invalid colors');

    // When
    const plainMessage = themeFieldMessage(plain.error);
    const paletteMessage = themeFieldMessage(palette.error);

    // Then
    expect(plainMessage.key).not.toBe(paletteMessage.key);
    expect(appEnglish[plainMessage.key]).toBeTruthy();
    expect(appEnglish[paletteMessage.key]).toBeTruthy();
    expect(dataGridThemeSchema.safeParse({ overlay: { errorColor: 'primary.main' } }).success).toBe(
      true,
    );
    expect(
      dataGridThemeSchema.safeParse({ overlay: { noDataColor: 'primary.main' } }).success,
    ).toBe(false);
  });
});

import { z } from 'zod';
import { previewPresetSchema } from './preview';

const concreteColor = z
  .string()
  .max(100)
  .refine((value) => {
    if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)) return true;
    const match = value.match(/^(rgb|rgba|hsl|hsla)\(([^)]+)\)$/i);
    if (!match?.[1] || !match[2]) return false;
    const kind = match[1].toLowerCase();
    const parts = match[2].split(',').map((part) => part.trim());
    if (parts.length !== (kind.endsWith('a') ? 4 : 3)) return false;
    return parts.every((part, index) => {
      if (!/^\d+(?:\.\d+)?%?$/.test(part)) return false;
      const number = Number.parseFloat(part);
      const maximum =
        index === 3
          ? part.endsWith('%')
            ? 100
            : 1
          : kind.startsWith('hsl')
            ? index === 0
              ? 360
              : 100
            : part.endsWith('%')
              ? 100
              : 255;
      if (kind.startsWith('hsl') && index > 0 && index < 3 && !part.endsWith('%')) return false;
      return number >= 0 && number <= maximum;
    });
  });
const color = z.union([concreteColor, z.enum(['transparent', 'currentColor'])]);
const overlayColor = z.union([
  color,
  z
    .string()
    .regex(/^(?:primary|secondary|error|warning|info|success)\.(?:main|light|dark|contrastText)$/),
]);
const size = z.union([
  z.number().min(0).max(500),
  z.string().regex(/^\d+(?:\.\d+)?(?:px|rem|em|%)?$/),
]);
const weight = z.union([
  z.number().min(100).max(900),
  z.string().regex(/^(?:[1-9]00|normal|bold)$/),
]);
const opacity = z.number().min(0).max(1);

export const dataGridThemeSchema = z.strictObject({
  header: z
    .strictObject({
      backgroundColor: color.optional(),
      borderColor: color.optional(),
      color: color.optional(),
      fontSize: size.optional(),
      fontWeight: weight.optional(),
      height: size.optional(),
      sortIconColor: color.optional(),
      sortIconInactiveOpacity: opacity.optional(),
      sortPriorityFirstColor: color.optional(),
      sortPrioritySecondColor: color.optional(),
      sortPriorityThirdColor: color.optional(),
      resizeHandleColor: color.optional(),
    })
    .optional(),
  body: z
    .strictObject({
      backgroundColor: color.optional(),
      color: color.optional(),
      fillBackgroundColor: color.optional(),
    })
    .optional(),
  row: z
    .strictObject({ backgroundColor: color.optional(), solidBackgroundColor: color.optional() })
    .optional(),
  cell: z.strictObject({ borderColor: color.optional(), fontSize: size.optional() }).optional(),
  state: z
    .strictObject({
      hoverBackgroundColor: color.optional(),
      hoverBorderColor: color.optional(),
      hoverRowBackgroundColor: color.optional(),
      hoverRowBorderColor: color.optional(),
      selectedCellBackgroundColor: color.optional(),
      selectedRowBackgroundColor: color.optional(),
      focusedRowBackgroundColor: color.optional(),
      focusedRowBorderColor: color.optional(),
      hoverCellBackgroundColor: color.optional(),
      hoverCellBorderColor: color.optional(),
      focusedCellBackgroundColor: color.optional(),
      focusedCellBorderColor: color.optional(),
      editingCellBorderColor: color.optional(),
      hintBackgroundColor: color.optional(),
      errorCellBorderColor: color.optional(),
      errorBoxBackgroundColor: color.optional(),
      focusedCellRectBackgroundColor: color.optional(),
    })
    .optional(),
  editable: z.strictObject({ backgroundColor: color.optional() }).optional(),
  added: z
    .strictObject({ rowBackgroundColor: color.optional(), overlayBorderColor: color.optional() })
    .optional(),
  deleted: z
    .strictObject({ rowBackgroundColor: color.optional(), color: color.optional() })
    .optional(),
  changed: z
    .strictObject({
      rowBackgroundColor: color.optional(),
      backgroundColor: color.optional(),
      color: color.optional(),
      fontWeight: weight.optional(),
    })
    .optional(),
  enumMenu: z
    .strictObject({
      hoverBackgroundColor: color.optional(),
      selectedBackgroundColor: color.optional(),
    })
    .optional(),
  filter: z
    .strictObject({
      backgroundColor: color.optional(),
      color: color.optional(),
      dateInputFontSize: size.optional(),
      bottomBorderColor: color.optional(),
      operatorColor: color.optional(),
      disabledOpacity: opacity.optional(),
      menuHoverBackgroundColor: color.optional(),
      menuSelectedBackgroundColor: color.optional(),
    })
    .optional(),
  panel: z
    .strictObject({
      backgroundColor: color.optional(),
      color: color.optional(),
      activeColor: color.optional(),
      deleteColor: color.optional(),
      disabledColor: color.optional(),
      inactiveFilterColor: color.optional(),
      hoverBackgroundColor: color.optional(),
      activeHoverBackgroundColor: color.optional(),
    })
    .optional(),
  region: z.strictObject({ edgeShadowColor: color.optional() }).optional(),
  overlay: z
    .strictObject({
      loadingBackgroundColor: color.optional(),
      loadingProgressColor: overlayColor.optional(),
      noDataColor: color.optional(),
      errorBackgroundColor: color.optional(),
      errorColor: overlayColor.optional(),
    })
    .optional(),
  frame: z.strictObject({ borderColor: color.optional() }).optional(),
  motion: z
    .strictObject({
      enabled: z.boolean().optional(),
      interactionDuration: z.number().min(0).max(5000).optional(),
      boundaryDuration: z.number().min(0).max(5000).optional(),
      easing: z
        .string()
        .regex(/^(?:linear|ease(?:-in|-out|-in-out)?|cubic-bezier\([\d\s.,-]+\))$/)
        .optional(),
      boundaryFeedbackColor: color.optional(),
      boundaryFeedbackSize: size.optional(),
    })
    .optional(),
  drag: z
    .strictObject({
      handleColor: color.optional(),
      handleActiveColor: color.optional(),
      sourceRowBackgroundColor: color.optional(),
      previewBackgroundColor: color.optional(),
      previewBorderColor: color.optional(),
      dropIndicatorColor: color.optional(),
    })
    .optional(),
  scrollbar: z
    .strictObject({
      backgroundColor: color.optional(),
      hoverBackgroundColor: color.optional(),
      borderColor: color.optional(),
      frameBorderColor: color.optional(),
      thumbColor: color.optional(),
      thumbHoverColor: color.optional(),
      arrowColor: color.optional(),
      horizontalThumbHeight: size.optional(),
      horizontalLargeThumbHeight: size.optional(),
      verticalThumbWidth: size.optional(),
      verticalLargeThumbWidth: size.optional(),
    })
    .optional(),
});

const paletteColor = z.strictObject({ main: concreteColor, contrastText: color.optional() });
export const muiThemeSchema = z.strictObject({
  palette: z.strictObject({
    mode: z.enum(['light', 'dark']),
    primary: paletteColor,
    secondary: paletteColor,
    success: paletteColor,
    warning: paletteColor,
    error: paletteColor,
    info: paletteColor,
    background: z.strictObject({ default: color, paper: color }),
    text: z.strictObject({ primary: color, secondary: color }),
    divider: color,
  }),
  typography: z.strictObject({
    fontSize: z.number().min(10).max(30),
  }),
  shape: z.strictObject({ borderRadius: z.number().min(0).max(32) }),
});

export const themeFileSchema = z.strictObject({
  format: z.literal('owp-theme'),
  version: z.literal(1),
  preset: previewPresetSchema,
  mui: muiThemeSchema,
  dataGrid: dataGridThemeSchema,
  dataGridProps: z.strictObject({ radius: z.number().min(0).max(2) }),
});

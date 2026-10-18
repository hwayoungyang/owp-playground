import { useOwpTranslation } from '@owp/components/hooks';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  getContrastRatio,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  amber,
  blue,
  blueGrey,
  brown,
  common,
  cyan,
  deepOrange,
  deepPurple,
  green,
  grey,
  indigo,
  lightBlue,
  lightGreen,
  lime,
  orange,
  pink,
  purple,
  red,
  teal,
  yellow,
} from '@mui/material/colors';
import { CheckIcon, XIcon } from '@phosphor-icons/react';

const colors = {
  red,
  pink,
  purple,
  deepPurple,
  indigo,
  blue,
  lightBlue,
  cyan,
  teal,
  green,
  lightGreen,
  lime,
  yellow,
  amber,
  orange,
  deepOrange,
  brown,
  grey,
  blueGrey,
  common,
};

const families = [
  'red',
  'pink',
  'purple',
  'deepPurple',
  'indigo',
  'blue',
  'lightBlue',
  'cyan',
  'teal',
  'green',
  'lightGreen',
  'lime',
  'yellow',
  'amber',
  'orange',
  'deepOrange',
  'brown',
  'grey',
  'blueGrey',
  'common',
] as const;

export function ColorPalette({
  label,
  value,
  onClose,
  onSelect,
}: {
  readonly label: string;
  readonly value: string;
  readonly onClose: () => void;
  readonly onSelect: (color: string) => void;
}) {
  const { t } = useOwpTranslation();
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth aria-labelledby="color-palette-title">
      <DialogTitle id="color-palette-title" className="color-palette-title">
        <div>
          <span>{t('MUI 색상 팔레트')}</span>
          <p>{label}</p>
        </div>
        <IconButton aria-label={t('색상 팔레트 닫기')} onClick={onClose}>
          <XIcon size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent className="color-palette-content">
        {families.map((family) => (
          <section key={family} className="color-palette-family" aria-label={family}>
            <h3>{family}</h3>
            <div className="color-palette-swatches">
              {Object.entries(colors[family]).map(([shade, hex]) => {
                const selected = value.toLowerCase() === hex.toLowerCase();
                const foreground =
                  getContrastRatio(hex, '#000000') >= getContrastRatio(hex, '#ffffff')
                    ? '#000000'
                    : '#ffffff';
                const name = `${family} ${shade} ${hex}`;
                return (
                  <Tooltip title={name} key={shade}>
                    <button
                      type="button"
                      aria-label={name}
                      aria-pressed={selected}
                      className="color-palette-swatch"
                      style={{ backgroundColor: hex, color: foreground }}
                      onClick={() => onSelect(hex)}
                    >
                      <span>{shade}</span>
                      {selected && <CheckIcon size={14} weight="bold" />}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </section>
        ))}
      </DialogContent>
    </Dialog>
  );
}

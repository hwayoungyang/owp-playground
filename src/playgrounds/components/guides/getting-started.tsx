import { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { OwpNumberField } from '@owp/components';

const theme = createTheme();

export function GettingStartedComponents() {
  const [quantity, setQuantity] = useState('12');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: '100%', maxWidth: 320 }}>
        <OwpNumberField
          fullWidth
          size="small"
          label="Quantity"
          helperText="Enter a whole number."
          value={quantity}
          decimalScale={0}
          allowNegative={false}
          onValueChange={(next, info) => {
            if (info.source === 'event') setQuantity(next.value);
          }}
        />
      </Box>
    </ThemeProvider>
  );
}

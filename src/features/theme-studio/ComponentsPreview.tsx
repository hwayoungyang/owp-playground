import { Button, Chip, FormControlLabel, Switch, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function ComponentsPreview() {
  const { t } = useTranslation('app');
  return (
    <div className="theme-components-preview">
      <Button variant="contained">{t('버튼')}</Button>
      <Button>{t('선택')}</Button>
      <Chip label={t('진행 중')} color="primary" />
      <Chip label={t('완료')} color="success" />
      <TextField label={t('입력')} defaultValue="OWP Playground" />
      <FormControlLabel label={t('알림')} control={<Switch defaultChecked />} />
    </div>
  );
}

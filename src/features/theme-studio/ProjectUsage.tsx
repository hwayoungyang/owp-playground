import { useTranslation } from 'react-i18next';
import { CodeSnippet } from '../code/CodeSnippet';
import { componentsThemeUsage, themeUsage } from './model/project-code';

export function ProjectUsage({ target }: { readonly target: 'datagrid' | 'components' }) {
  const { t } = useTranslation('app');
  return (
    <section className="theme-project-usage" aria-label={t('프로젝트에 적용')}>
      <h3>{t('프로젝트에 적용')}</h3>
      <p className="theme-usage-note">
        {t('한금 소비앱과 OWP Core 프로젝트의 configs/theme 설정에 저장값을 연결합니다.')}
      </p>
      <p className="theme-usage-note">
        {t(
          target === 'datagrid'
            ? '기존 settingsConfig에 themeOverrides를 병합하고 OwpCoreProvider에 전달합니다. 모서리 값은 DataGrid의 radius 속성에 적용합니다.'
            : '기존 OwpStyleProvider에 확장한 MUI 테마를 전달합니다.',
        )}
      </p>
      {(target === 'datagrid' ? themeUsage : componentsThemeUsage).map(({ file, code }) => (
        <CodeSnippet key={file} label={file} code={code} language="typescript" />
      ))}
    </section>
  );
}

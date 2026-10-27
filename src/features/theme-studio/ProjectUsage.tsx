import { useOwpTranslation } from '@owp/components/hooks';
import { CodeSnippet } from '../code/CodeSnippet';
import { componentsThemeUsage, themeUsage } from './model/project-code';

export function ProjectUsage({ target }: { readonly target: 'datagrid' | 'components' }) {
  const { t } = useOwpTranslation();
  return (
    <section className="theme-project-usage" aria-label={t('프로젝트에 적용')}>
      <h3>{t('프로젝트에 적용')}</h3>
      <p className="theme-usage-note">
        {t('저장한 테마 설정을 프로젝트의 configs/theme에 적용합니다.')}
      </p>
      <p className="theme-usage-note">
        {t(
          target === 'datagrid'
            ? '기존 settingsConfig에 themeOverrides를 병합하고 OwpCoreProvider에 전달합니다. 모서리 둥글기는 DataGrid의 radius 속성에 적용합니다.'
            : '기존 OwpStyleProvider에 확장한 MUI 테마를 전달합니다.',
        )}
      </p>
      {(target === 'datagrid' ? themeUsage : componentsThemeUsage).map(({ file, code }) => (
        <CodeSnippet key={file} label={file} code={code} language="typescript" />
      ))}
    </section>
  );
}

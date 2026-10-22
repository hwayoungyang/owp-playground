import './styles.css';
import { Button, MenuItem, Select, TextField } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { OwpDataGrid } from '@owp/datagrid';
import { useDataGridApi } from '@owp/datagrid/hooks';
import { useId, useMemo, useState } from 'react';
import { PreviewActions } from '../../../shared/ui/PreviewActions';
import { useExampleFeedback } from '../../../shared/ui/useExampleFeedback';
import type { Task, TaskGridProps } from '../types';
import { compileTextPattern, defaultTextPattern, matchesTextPattern } from './configs/textPattern';
import {
  createTextInputPolicyColumns,
  taskTextInputPolicyConfiguration,
  textFeedbackPresets,
  type TextFeedbackPreset,
  type TextPolicyValidation,
} from './configs/taskTextInputPolicy';

export { taskTextInputPolicyConfiguration as gridConfiguration } from './configs/taskTextInputPolicy';

export function TextInputPolicyGrid(props: TaskGridProps = {}) {
  const { t } = useOwpTranslation();
  const messageId = useId();
  const patternId = useId();
  const testValueId = useId();
  const ownApi = useDataGridApi<Task>();
  const { api: suppliedApi, callbacks, ...gridProps } = props;
  const gridApi = suppliedApi ?? ownApi;
  const [feedback, setFeedback] = useState<TextFeedbackPreset>(textFeedbackPresets[0]);
  const [validation, setValidation] = useState<TextPolicyValidation>({
    validationMode: 'manual',
    required: true,
    clearErrorOnInput: false,
  });
  const { notify, dismiss, feedback: actionFeedback } = useExampleFeedback();
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const message = customMessage ?? t('Y 또는 N 한 글자를 입력해 주세요.');
  const [patternSource, setPatternSource] = useState(defaultTextPattern);
  const draftPattern = useMemo(() => compileTextPattern(patternSource), [patternSource]);
  const [appliedPattern, setAppliedPattern] = useState<{
    readonly source: string;
    readonly pattern: RegExp | null;
  }>(() => ({
    source: defaultTextPattern,
    pattern: new RegExp(defaultTextPattern),
  }));
  const [testValue, setTestValue] = useState('Ab12');
  const columns = useMemo(
    () =>
      createTextInputPolicyColumns(
        gridProps.columns,
        feedback,
        validation,
        message,
        appliedPattern.pattern,
      ),
    [gridProps.columns, feedback, validation, message, appliedPattern.pattern],
  );
  const commitCurrentEdit = (action: string) => {
    dismiss();
    const committed = gridApi.commitEditing();
    if (!committed) {
      notify(t('편집을 확정하지 못했습니다. 입력을 마친 뒤 다시 시도해 주세요.'), 'error');
    }
    callbacks?.onAction?.('commitEditing', { action, committed });
    return committed;
  };
  const applyPattern = () => {
    if (!draftPattern.valid || patternSource === appliedPattern.source) return;
    const committed = commitCurrentEdit('allowedPattern');
    callbacks?.onAction?.('textPattern.apply', { source: patternSource, applied: committed });
    if (!committed) return;
    setAppliedPattern({ source: patternSource, pattern: draftPattern.pattern });
    notify(
      t(patternSource === '' ? '정규식 제한을 해제했습니다.' : '정규식을 적용했습니다.'),
      'success',
    );
  };
  const checkMatch = () => {
    if (!draftPattern.valid) return;
    const accepted = matchesTextPattern(draftPattern.pattern, testValue);
    callbacks?.onAction?.('textPattern.match', {
      source: patternSource,
      value: testValue,
      accepted,
    });
    notify(
      t(
        testValue === ''
          ? '빈 값은 입력 정책에서 허용합니다. 필수 입력은 별도로 검사합니다.'
          : accepted
            ? '값 전체가 일치합니다.'
            : '값 전체가 일치하지 않습니다.',
      ),
      testValue === '' ? 'info' : accepted ? 'success' : 'warning',
    );
  };
  const changeFeedback = (next: TextFeedbackPreset) => {
    if (next.id === feedback.id || !commitCurrentEdit('textOptions')) return;
    setFeedback(next);
    callbacks?.onAction?.('textOptions', { preset: next.id, columnId: 'owner' });
  };
  const changeMessage = (next: string) => {
    if (next === message) return;
    const committed = commitCurrentEdit('rejectedInputMessage');
    callbacks?.onAction?.('rejectedInputMessage', {
      columnId: 'owner',
      message: next,
      applied: committed,
    });
    if (!committed) return;
    setCustomMessage(next);
  };
  const changeValidation = (next: TextPolicyValidation) => {
    if (!commitCurrentEdit('validationOptions')) return;
    setValidation((current) => ({ ...current, ...next }));
    callbacks?.onAction?.('validationOptions', next);
  };
  const validate = () => {
    if (!commitCurrentEdit('validate')) return;
    const result = gridApi.validate();
    callbacks?.onAction?.('validate', result);
    notify(
      result.valid
        ? t('검사를 통과했습니다.')
        : t('검사 결과: 오류 {{count}}건', { count: result.errors.length }),
      result.valid ? 'success' : 'warning',
    );
  };
  const showExternalErrors = () => {
    const applied = gridApi.setCellErrors([
      { rowId: 'task-1', columnId: 'owner', message: t('입력 정책 비교용 외부 오류입니다.') },
    ]);
    callbacks?.onAction?.('setCellErrors', applied);
    notify(
      t(
        applied
          ? '첫 행의 안내·오류 비교 셀에 외부 오류를 표시했습니다.'
          : '외부 오류를 표시하지 못했습니다.',
      ),
      applied ? 'info' : 'error',
    );
  };
  const inspectChanges = () => {
    const state = {
      unsaved: gridApi.hasUnsavedChanges(),
      changes: gridApi.getChanges().length,
    };
    callbacks?.onAction?.('inputPolicySnapshot', { ...state, rows: gridApi.getRows() });
    notify(
      t(
        state.unsaved
          ? '미저장 입력이 있습니다. Working-copy 변경 {{count}}건입니다.'
          : '미저장 입력이 없습니다. Working-copy 변경 {{count}}건입니다.',
        { count: state.changes },
      ),
    );
  };
  return (
    <div
      className="example-with-controls"
      style={{ height: props.height ?? taskTextInputPolicyConfiguration.height }}
    >
      <PreviewActions>
        <div className="example-settings-toolbar example-settings-toolbar--text">
          <div className="example-settings-fields example-settings-fields--text">
            <section className="text-policy-setting" aria-label={t('직접 설정한 정규식')}>
              <h3>{t('직접 설정한 정규식')}</h3>
              <div className="example-setting-field">
                <label className="example-setting-label" htmlFor={patternId}>
                  {t('정규식')}
                </label>
                <div className="text-policy-input-action">
                  <TextField
                    id={patternId}
                    value={patternSource}
                    error={!draftPattern.valid}
                    helperText={
                      !draftPattern.valid
                        ? t('정규식 형식이 올바르지 않습니다.')
                        : t('문법이 올바릅니다. 일치 여부는 별도로 확인해 주세요.')
                    }
                    onChange={(event) => {
                      setPatternSource(event.target.value);
                      dismiss();
                    }}
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    disabled={!draftPattern.valid || patternSource === appliedPattern.source}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={applyPattern}
                  >
                    {t('정규식 적용')}
                  </Button>
                </div>
              </div>
              <p className="example-setting-help">
                {t('작성한 정규식은 적용 버튼을 눌러야 Grid에 반영됩니다.')}
                <br />
                {t('빈 정규식은 문자 제한을 두지 않습니다.')}
              </p>
              <h4>{t('작성한 정규식 테스트')}</h4>
              <div className="example-setting-field">
                <label className="example-setting-label" htmlFor={testValueId}>
                  {t('테스트할 값')}
                </label>
                <div className="text-policy-input-action">
                  <TextField
                    id={testValueId}
                    value={testValue}
                    onChange={(event) => {
                      setTestValue(event.target.value);
                      dismiss();
                    }}
                    size="small"
                  />
                  <Button variant="outlined" disabled={!draftPattern.valid} onClick={checkMatch}>
                    {t('일치 확인')}
                  </Button>
                </div>
              </div>
              <p className="text-policy-status">
                {t('일치 확인은 작성 중인 정규식으로 값 전체를 검사합니다.')}
              </p>
            </section>
            <section className="text-policy-setting" aria-label={t('입력 안내·오류 비교')}>
              <h3>{t('입력 안내·오류 비교')}</h3>
              <p className="text-policy-status">
                {t('입력 거부 안내와 검증 오류의 표시 방식을 비교합니다.')}
              </p>
              <p className="text-policy-status">
                {t('테스트 규칙: Y/N 한 글자 · 소문자는 대문자로 변환')}
              </p>
              <fieldset className="example-setting-field" aria-label={t('입력 거부 안내')}>
                <span className="example-setting-label">{t('입력 거부 안내')}</span>
                <Select
                  value={feedback.id}
                  inputProps={{ 'aria-label': t('입력 거부 안내') }}
                  onChange={(event) => {
                    const next = textFeedbackPresets.find(
                      (preset) => preset.id === event.target.value,
                    );
                    if (next) changeFeedback(next);
                  }}
                >
                  {textFeedbackPresets.map((preset) => (
                    <MenuItem key={preset.id} value={preset.id}>
                      {t(preset.label)}
                    </MenuItem>
                  ))}
                </Select>
              </fieldset>
              <div
                className={`example-setting-field text-policy-custom-message${feedback.id === 'custom' ? '' : ' is-hidden'}`}
                aria-hidden={feedback.id !== 'custom'}
              >
                <label className="example-setting-label" htmlFor={messageId}>
                  {t('사용자 안내 문구')}
                </label>
                <TextField
                  id={messageId}
                  helperText={t('빈 값이나 공백만 입력하면 기본 안내 문구를 사용합니다.')}
                  value={message}
                  disabled={feedback.id !== 'custom'}
                  onChange={(event) => changeMessage(event.target.value)}
                  size="small"
                />
              </div>
              <details className="text-policy-validation">
                <summary>{t('검증 설정')}</summary>
                <p className="text-policy-status">
                  {t('검증 설정은 안내·오류 비교 컬럼에만 적용합니다.')}
                </p>
                <div className="text-policy-validation-fields">
                  <fieldset className="example-setting-field" aria-label={t('검사 시점')}>
                    <span className="example-setting-label">{t('검사 시점')}</span>
                    <div className="example-setting-buttons">
                      {(['manual', 'onCommit'] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={validation.validationMode === mode ? 'contained' : 'outlined'}
                          aria-pressed={validation.validationMode === mode}
                          onClick={() => changeValidation({ validationMode: mode })}
                        >
                          {t(mode === 'onCommit' ? '값 확정 시' : '직접 검사')}
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="example-setting-field" aria-label={t('입력 조건')}>
                    <span className="example-setting-label">{t('입력 조건')}</span>
                    <div className="example-setting-buttons">
                      <Button
                        variant={validation.required ? 'contained' : 'outlined'}
                        aria-pressed={Boolean(validation.required)}
                        onClick={() => changeValidation({ required: !validation.required })}
                      >
                        {t('필수 입력')}
                      </Button>
                      <Button
                        variant={validation.clearErrorOnInput ? 'contained' : 'outlined'}
                        aria-pressed={Boolean(validation.clearErrorOnInput)}
                        onClick={() =>
                          changeValidation({ clearErrorOnInput: !validation.clearErrorOnInput })
                        }
                      >
                        {t('수정 시 오류 해제')}
                      </Button>
                    </div>
                  </fieldset>
                </div>
              </details>
            </section>
            <section className="text-policy-setting" aria-label={t('영문·숫자 코드')}>
              <h3>{t('영문·숫자 코드')}</h3>
              <code className="text-policy-pattern">{'^[A-Z0-9]*$'}</code>
              <p className="text-policy-status">
                {t('소문자는 대문자로 바꾸며 영문과 숫자만 허용합니다.')}
              </p>
              <p className="text-policy-status">
                {t('이 컬럼은 기본 거부 안내를 항상 표시합니다.')}
              </p>
            </section>
          </div>
          <div className="example-settings-actions">
            <Button variant="outlined" onClick={validate}>
              {t('입력 검증')}
            </Button>
            <Button variant="outlined" onClick={showExternalErrors}>
              {t('외부 오류 표시')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                gridApi.clearCellErrors();
                callbacks?.onAction?.('clearCellErrors', { source: 'external' });
                notify(
                  t('외부 오류를 모두 해제했습니다. intrinsic 검증 오류는 유지됩니다.'),
                  'success',
                );
              }}
            >
              {t('외부 오류 모두 해제')}
            </Button>
            <Button
              variant="outlined"
              onMouseDown={(event) => event.preventDefault()}
              onClick={inspectChanges}
            >
              {t('현재 변경 상태 조회')}
            </Button>
          </div>
        </div>
      </PreviewActions>
      {actionFeedback}
      <div className="example-guidance">
        <p>
          {t(
            '둘째 행의 기존 서버 값은 정책을 바꿔도 그대로 유지됩니다. 외부 오류는 첫 행의 두 번째 셀에서 비교합니다.',
          )}
        </p>
      </div>
      <div className="example-grid">
        <OwpDataGrid
          api={gridApi}
          rows={taskTextInputPolicyConfiguration.rows}
          getRowId={taskTextInputPolicyConfiguration.getRowId}
          rowSelectionMode="multiple"
          visibleRowCount={taskTextInputPolicyConfiguration.visibleRowCount}
          {...gridProps}
          columns={columns}
          height={props.height ?? taskTextInputPolicyConfiguration.height}
        />
      </div>
    </div>
  );
}

import { useOwpTranslation } from '@owp/components/hooks';
import { CodeIcon, ColumnsIcon, FileTextIcon } from '@phosphor-icons/react';
import { type ReactNode, useRef, useState } from 'react';
import './reference-workbench.css';

export type WorkbenchMode = 'split' | 'content' | 'code';
export type ReferenceWorkbenchProps = {
  readonly idPrefix: string;
  readonly mode: WorkbenchMode;
  readonly onModeChange: (mode: WorkbenchMode) => void;
  readonly activePanel: 'content' | 'code';
  readonly contentLabel?: string;
  readonly children: ReactNode;
  readonly code: ReactNode;
  readonly navigation?: ReactNode;
};

export function ReferenceWorkbench({
  idPrefix,
  mode,
  onModeChange,
  activePanel,
  contentLabel = 'API 참조',
  children,
  code,
  navigation,
}: ReferenceWorkbenchProps) {
  const { t } = useOwpTranslation();
  const [share, setShare] = useState(56);
  const [hasViewTransition, setHasViewTransition] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const clampShare = (value: number) => Math.min(70, Math.max(35, value));
  const controls = [
    { value: 'split', label: '나란히 보기', icon: <ColumnsIcon size={15} aria-hidden /> },
    { value: 'content', label: '본문만 보기', icon: <FileTextIcon size={15} aria-hidden /> },
    { value: 'code', label: '코드만 보기', icon: <CodeIcon size={15} aria-hidden /> },
  ] as const;
  return (
    <div
      className="reference-workbench"
      data-mode={mode}
      data-active={activePanel}
      data-view-transition={hasViewTransition || undefined}
    >
      <div className="reference-workbench-toolbar">
        {navigation && <div className="reference-workbench-navigation">{navigation}</div>}
        <div className="reference-workbench-controls" role="group" aria-label={t('예제 보기 방식')}>
          {controls.map((control) => (
            <button
              type="button"
              key={control.value}
              aria-pressed={mode === control.value}
              onClick={() => {
                if (control.value === mode) return;
                setHasViewTransition(true);
                onModeChange(control.value);
              }}
            >
              {control.icon}
              <span>{t(control.label)}</span>
            </button>
          ))}
        </div>
      </div>
      <div
        className="reference-workbench-grid"
        ref={grid}
        style={{ gridTemplateColumns: `minmax(0, ${share}fr) 8px minmax(0, ${100 - share}fr)` }}
      >
        <div id={`${idPrefix}-content`} className="reference-workbench-content">
          <div className="reference-pane-heading">{t(contentLabel)}</div>
          {children}
        </div>
        <button
          type="button"
          className="reference-workbench-separator"
          role="separator"
          aria-label={t('본문과 코드 너비 조절')}
          aria-orientation="vertical"
          aria-valuemin={35}
          aria-valuemax={70}
          aria-valuenow={Math.round(share)}
          aria-controls={`${idPrefix}-content ${idPrefix}-source`}
          onKeyDown={(event) => {
            const deltas: Readonly<Record<string, number>> = { ArrowLeft: -2, ArrowRight: 2 };
            const delta = deltas[event.key];
            if (event.key === 'Home') {
              event.preventDefault();
              setShare(35);
            } else if (event.key === 'End') {
              event.preventDefault();
              setShare(70);
            } else if (delta !== undefined) {
              event.preventDefault();
              setShare((previous) => clampShare(previous + delta));
            }
          }}
          onPointerDown={(event) => {
            if (event.button === 0) event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            const bounds = grid.current?.getBoundingClientRect();
            if (bounds && bounds.width > 0)
              setShare(clampShare(((event.clientX - bounds.left) / bounds.width) * 100));
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
        >
          <span aria-hidden />
        </button>
        <div id={`${idPrefix}-source`} className="reference-workbench-source">
          <div className="reference-pane-heading">{t('코드')}</div>
          {code}
        </div>
      </div>
    </div>
  );
}

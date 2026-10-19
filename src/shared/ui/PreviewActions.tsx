import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type ActionPosition = 'start' | 'end';
type ActionTarget = {
  readonly target: HTMLDivElement | null;
  readonly setTarget: (target: HTMLDivElement | null) => void;
};
const ActionsContext = createContext<Readonly<Record<ActionPosition, ActionTarget>> | null>(null);

export function PreviewActionsProvider({ children }: { readonly children: ReactNode }) {
  const [start, setStart] = useState<HTMLDivElement | null>(null);
  const [end, setEnd] = useState<HTMLDivElement | null>(null);
  const value = useMemo(
    () => ({
      start: { target: start, setTarget: setStart },
      end: { target: end, setTarget: setEnd },
    }),
    [start, end],
  );
  return <ActionsContext value={value}>{children}</ActionsContext>;
}

export function PreviewActionsHost({
  children,
  position = 'start',
}: {
  readonly children?: ReactNode;
  readonly position?: ActionPosition;
}) {
  const actions = useContext(ActionsContext);
  return (
    <div
      ref={actions?.[position].setTarget}
      className={position === 'start' ? 'preview-start-actions' : 'preview-extra-actions'}
    >
      {children}
    </div>
  );
}

export function PreviewActions({
  children,
  position = 'start',
}: {
  readonly children: ReactNode;
  readonly position?: ActionPosition;
}) {
  const actions = useContext(ActionsContext);
  if (!actions) return children;
  const target = actions[position].target;
  return target ? createPortal(children, target) : null;
}

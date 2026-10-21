import { type RefObject, useLayoutEffect, useRef } from 'react';

export function useAvailableChartHeight(enabled = true, root?: RefObject<HTMLElement | null>) {
  const plot = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!enabled) return;
    const host = root?.current ?? plot.current;
    if (!root && host?.closest('.chart-preview')) return;
    const main = host?.closest('main');
    const workspace = host?.closest('.workspace');
    if (!host || !main || !workspace) return;
    let frame = 0;
    const resize = () => {
      if (!host.offsetHeight) return;
      const plots = host.matches('.chart-canvas')
        ? [host]
        : [...host.querySelectorAll<HTMLElement>('.chart-canvas')];
      if (!plots.length) return;
      const rows = new Map<number, number>();
      for (const item of plots) {
        const bounds = item.getBoundingClientRect();
        const top = Math.round(bounds.top);
        rows.set(top, Math.max(rows.get(top) ?? 0, bounds.height));
      }
      const reserved =
        workspace.getBoundingClientRect().bottom -
        main.getBoundingClientRect().top +
        main.scrollTop +
        Number.parseFloat(getComputedStyle(main).paddingBottom) -
        [...rows.values()].reduce((total, height) => total + height, 0);
      const height = `${Math.max(160, Math.floor((main.clientHeight - reserved) / rows.size))}px`;
      if (host.style.getPropertyValue('--chart-available-height') !== height)
        host.style.setProperty('--chart-available-height', height);
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        resize();
      });
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(main);
    observer.observe(workspace);
    const content = new MutationObserver(schedule);
    content.observe(host, { childList: true, subtree: true });
    resize();
    return () => {
      observer.disconnect();
      content.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [enabled, root]);
  return plot;
}

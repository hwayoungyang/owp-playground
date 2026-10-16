import { useOwpTranslation } from '@owp/components/hooks';
import { type RefObject, useLayoutEffect } from 'react';

/** 네이티브 범위 컨트롤의 이름과 범례·초기화 버튼의 키보드 접근을 연결합니다. */
export function useChartAccessibility(host: RefObject<HTMLElement | null>) {
  const { t } = useOwpTranslation();
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const connect = () => {
      let vertical = 0;
      for (const slider of element.querySelectorAll('.rc-slider')) {
        const isVertical = slider.classList.contains('rc-slider-vertical');
        const axis = isVertical ? t('Y축 {{number}}', { number: ++vertical }) : t('X축');
        for (const [index, handle] of slider.querySelectorAll('[role="slider"]').entries()) {
          handle.setAttribute(
            'aria-label',
            t('{{axis}} {{edge}}', {
              axis,
              edge: t(index === 0 ? '범위 시작' : '범위 끝'),
            }),
          );
        }
      }
      for (const button of element.querySelectorAll<HTMLButtonElement>(
        '.owp-chart-surface button[tabindex]',
      )) {
        button.tabIndex = button.getAttribute('aria-hidden') === 'true' ? -1 : 0;
      }
    };
    connect();
    const observer = new MutationObserver(connect);
    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-hidden'],
    });
    return () => observer.disconnect();
  }, [host, t]);
}

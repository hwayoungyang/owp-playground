import { useId, useLayoutEffect, useRef } from 'react';

export function useGridAccessibility() {
  const host = useRef<HTMLElement>(null);
  const prefix = useId();
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    let sequence = 0;
    const setAttribute = (node: Element, name: string, value: string) => {
      if (node.getAttribute(name) !== value) node.setAttribute(name, value);
    };
    const connect = () => {
      for (const icon of element.querySelectorAll('[role="columnheader"] > span[aria-label]')) {
        setAttribute(icon, 'role', 'img');
      }
      for (const root of element.querySelectorAll('.OwpDataGrid-root')) {
        const content = root.querySelector('.OwpDataGrid-scrollContent');
        if (!content) continue;
        // Data rows own the grid role; native scrollbars and toolbars remain accessible siblings.
        setAttribute(root, 'role', 'group');
        const tree = Array.from(content.querySelectorAll('[role="row"][aria-level]')).some(
          (row) => row.closest('.OwpDataGrid-root') === root,
        );
        setAttribute(content, 'role', tree ? 'treegrid' : 'grid');
        for (const attribute of ['aria-label', 'aria-colcount', 'aria-rowcount']) {
          const value = root.getAttribute(attribute);
          if (value !== null) setAttribute(content, attribute, value);
          if (attribute !== 'aria-label') root.removeAttribute(attribute);
        }
        const externalGroups = Array.from(root.querySelectorAll('[role="rowgroup"]')).filter(
          (group) => group.closest('.OwpDataGrid-root') === root && !content.contains(group),
        );
        for (const group of externalGroups) {
          if (!group.id) {
            sequence += 1;
            group.id = `${prefix}-grid-rows-${sequence}`;
          }
        }
        if (externalGroups.length > 0)
          setAttribute(content, 'aria-owns', externalGroups.map((group) => group.id).join(' '));
        else content.removeAttribute('aria-owns');
      }
    };
    connect();
    const observer = new MutationObserver(connect);
    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-rowcount', 'aria-colcount'],
    });
    return () => observer.disconnect();
  }, [prefix]);
  return host;
}

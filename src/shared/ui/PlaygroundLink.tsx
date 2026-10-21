import { createContext, type ComponentProps, type ReactNode, useContext } from 'react';

const NavigationContext = createContext<((href: string) => void) | null>(null);

export function PlaygroundNavigation({
  onNavigate,
  children,
}: {
  readonly onNavigate: (href: string) => void;
  readonly children: ReactNode;
}) {
  return <NavigationContext value={onNavigate}>{children}</NavigationContext>;
}

export function PlaygroundLink({
  href,
  children,
  ...props
}: Omit<ComponentProps<'a'>, 'onClick'> & { readonly href: string }) {
  const navigate = useContext(NavigationContext);
  return (
    <a
      {...props}
      href={href}
      data-playground-link
      onClick={(event) => {
        if (
          !navigate ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './app/i18n';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/styles/shell.css';
import './app/styles/workspace.css';
import './features/code/styles.css';

if (import.meta.env.DEV && import.meta.env.VITE_DISABLE_REACT_DEVTOOLS !== '1') {
  void import('react-grab');
  void import('react-scan').then(({ scan }) => scan({ enabled: true, showToolbar: false }));
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);

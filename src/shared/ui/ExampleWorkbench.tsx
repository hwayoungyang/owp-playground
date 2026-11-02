import { useMediaQuery } from '@mui/material';
import { Activity, type ReactNode, useState } from 'react';
import type { WorkspaceTab } from './WorkspaceTabs';
import { updateWorkspaceTabUrl } from './WorkspaceTabs';
import { ReferenceWorkbench, type WorkbenchMode } from './ReferenceWorkbench';

const contentLabels = {
  preview: '예제',
  code: '예제',
  data: '데이터',
  events: '이벤트',
  props: 'Props',
  params: 'Params',
  returns: 'Returns',
  type: 'Type',
} satisfies Readonly<Record<WorkspaceTab, string>>;

export function ExampleWorkbench({
  idPrefix,
  tab,
  onTabChange,
  children,
  code,
  rounded,
}: {
  readonly idPrefix: string;
  readonly tab: WorkspaceTab;
  readonly onTabChange: (tab: WorkspaceTab) => void;
  readonly children: ReactNode;
  readonly code: ReactNode;
  readonly rounded?: boolean;
}) {
  const [layout, setLayout] = useState<WorkbenchMode>('content');
  const wide = useMediaQuery('(min-width:1100px)');
  const codeVisible = tab === 'code' || (wide && layout === 'split');
  return (
    <div className="example-workbench">
      <ReferenceWorkbench
        idPrefix={`${idPrefix}-workbench`}
        contentLabel={contentLabels[tab]}
        mode={tab === 'code' ? 'code' : layout}
        activePanel={tab === 'code' ? 'code' : 'content'}
        code={<Activity mode={codeVisible ? 'visible' : 'hidden'}>{code}</Activity>}
        onModeChange={(next) => {
          if (next !== 'code') setLayout(next);
          const nextTab = next === 'code' ? 'code' : tab === 'code' ? 'preview' : tab;
          onTabChange(nextTab);
          updateWorkspaceTabUrl(nextTab);
        }}
      >
        <div className="workspace-frame" data-rounded={rounded}>
          {children}
        </div>
      </ReferenceWorkbench>
    </div>
  );
}

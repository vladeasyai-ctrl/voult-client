'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { MindMapCanvas } from '@/components/vault/mind-map-canvas';
import { DocumentPanel } from '@/components/vault/document-panel';
import { useVaultStore } from '@/stores/vault-store';
import type { DropTarget } from '@/lib/types';

interface VaultLayoutProps {
  onUploadFiles: (files: File[], target?: DropTarget) => Promise<void>;
}

export function VaultLayout({ onUploadFiles }: VaultLayoutProps) {
  const rightPanelOpen = useVaultStore((s) => s.rightPanelOpen);

  return (
    <PanelGroup
      direction="horizontal"
      autoSaveId="vault-panels-v2"
      className="min-h-0 flex-1"
    >
      <Panel defaultSize={rightPanelOpen ? 68 : 100} minSize={45}>
        <MindMapCanvas onUploadFiles={onUploadFiles} />
      </Panel>
      {rightPanelOpen && (
        <>
          <PanelResizeHandle />
          <Panel defaultSize={32} minSize={24} maxSize={45}>
            <DocumentPanel />
          </Panel>
        </>
      )}
    </PanelGroup>
  );
}

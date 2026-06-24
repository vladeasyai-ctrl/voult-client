'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { MindMapCanvas } from '@/components/vault/mind-map-canvas';
import { DetailPanel } from '@/components/vault/detail-panel';
import { AiImportStack } from '@/components/vault/ai-import-stack';
import { useVaultStore } from '@/stores/vault-store';
import type { DropTarget } from '@/lib/types';
import type { AiImportQueue } from '@/hooks/use-ai-import-queue';

interface VaultLayoutProps {
  onUploadFiles: (files: File[], target?: DropTarget) => Promise<void>;
  onFolderUploadFiles?: (files: File[], folderId: string) => Promise<void>;
  onAiImportFiles: (files: File[], target: DropTarget) => void;
  aiImportQueue: AiImportQueue;
}

export function VaultLayout({
  onUploadFiles,
  onFolderUploadFiles,
  onAiImportFiles,
  aiImportQueue,
}: VaultLayoutProps) {
  const rightPanelOpen = useVaultStore((s) => s.rightPanelOpen);

  return (
    <PanelGroup
      direction="horizontal"
      autoSaveId="vault-panels-v2"
      className="min-h-0 flex-1"
    >
      <Panel defaultSize={rightPanelOpen ? 68 : 100} minSize={45}>
        <div className="relative h-full">
          <MindMapCanvas
            onUploadFiles={onUploadFiles}
            onFolderUploadFiles={onFolderUploadFiles}
            onAiImportFiles={onAiImportFiles}
          />
          <AiImportStack queue={aiImportQueue} />
        </div>
      </Panel>
      {rightPanelOpen && (
        <>
          <PanelResizeHandle />
          <Panel defaultSize={32} minSize={24} maxSize={45}>
            <DetailPanel />
          </Panel>
        </>
      )}
    </PanelGroup>
  );
}

'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { MindMapCanvas } from '@/components/vault/mind-map-canvas';
import { DocumentPanel } from '@/components/vault/document-panel';
import { AiImportCard } from '@/components/vault/ai-import-card';
import { useVaultStore } from '@/stores/vault-store';
import type { DropTarget } from '@/lib/types';
import type { useAiImport } from '@/hooks/use-ai-import';

interface VaultLayoutProps {
  onUploadFiles: (files: File[], target?: DropTarget) => Promise<void>;
  onAiImportFile: (file: File, target: DropTarget) => void;
  aiImportOpen: boolean;
  onAiImportClose: () => void;
  aiImport: ReturnType<typeof useAiImport>;
}

export function VaultLayout({
  onUploadFiles,
  onAiImportFile,
  aiImportOpen,
  onAiImportClose,
  aiImport,
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
          <MindMapCanvas onUploadFiles={onUploadFiles} onAiImportFile={onAiImportFile} />
          <AiImportCard open={aiImportOpen} onClose={onAiImportClose} external={aiImport} />
        </div>
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

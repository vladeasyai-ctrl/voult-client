'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GitBranch, ScanLine } from 'lucide-react';
import {
  countDocumentsForFolder,
  countDocumentsUnderRoot,
  findFolderForTemplate,
  findRegionById,
  HEALTH_BODY_REGIONS,
  type HealthBodyRegion,
  type HealthFolderTemplate,
} from '@/lib/health-body-map';
import { t } from '@/lib/i18n';
import type { Document, TreeNode } from '@/lib/types';
import { HealthBodyRegionView } from '@/components/vault/health-body-region-view';
import { HealthBodySilhouette } from '@/components/vault/health-body-silhouette';

interface HealthBodyCanvasProps {
  root: TreeNode;
  documents: Document[];
  onCreateFolder: (name: string) => Promise<void>;
  onSelectFolder: (folderId: string) => void;
  onSwitchToTree: () => void;
}

export function HealthBodyCanvas({
  root,
  documents,
  onCreateFolder,
  onSelectFolder,
  onSwitchToTree,
}: HealthBodyCanvasProps) {
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const childFolders = useMemo(
    () => root.children.filter((c) => c.type === 'FOLDER'),
    [root.children],
  );

  const totalDocs = useMemo(
    () => countDocumentsUnderRoot(root, documents),
    [root, documents],
  );

  const regionDocCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const region of HEALTH_BODY_REGIONS) {
      let total = 0;
      for (const template of region.folders) {
        const folder = findFolderForTemplate(template, childFolders);
        total += countDocumentsForFolder(folder, documents);
      }
      map.set(region.id, total);
    }
    return map;
  }, [childFolders, documents]);

  const activeRegion = activeRegionId ? findRegionById(activeRegionId) : null;

  const regionFolders = useMemo(() => {
    if (!activeRegion) return [];
    return activeRegion.folders.map((template) => {
      const folder = findFolderForTemplate(template, childFolders);
      return {
        template,
        folderId: folder?.id ?? null,
        docCount: countDocumentsForFolder(folder, documents),
      };
    });
  }, [activeRegion, childFolders, documents]);

  const handleCreate = async (template: HealthFolderTemplate) => {
    setCreatingId(template.id);
    try {
      await onCreateFolder(template.folderName);
    } finally {
      setCreatingId(null);
    }
  };

  const focus = activeRegion?.focus ?? { xPct: 50, yPct: 50 };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(34,211,238,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      <div className="relative z-[1] flex shrink-0 items-center justify-between gap-3 border-b border-cyan-500/15 bg-slate-950/60 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/25">
            <ScanLine size={18} />
          </span>
          <div>
            <p className="text-xs text-cyan-200/50">
              {t('vault.healthXrayMap', { count: totalDocs })}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-lg text-cyan-50">
              {root.name}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onSwitchToTree}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-slate-900/80 px-3 py-1.5 text-xs text-cyan-200/70 transition hover:border-cyan-400/40 hover:bg-slate-800 hover:text-cyan-100"
        >
          <GitBranch size={13} />
          {t('common.tree')}
        </button>
      </div>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center gap-8 overflow-auto p-6 lg:flex-row lg:items-center lg:justify-center lg:gap-16 lg:p-10">
        <motion.div
          className="relative shrink-0"
          style={{ transformOrigin: `${focus.xPct}% ${focus.yPct}%` }}
          animate={{ scale: activeRegion ? 2.35 : 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        >
          <HealthBodySilhouette
            regions={HEALTH_BODY_REGIONS}
            activeRegionId={activeRegionId}
            regionDocCounts={regionDocCounts}
            onSelectRegion={(region: HealthBodyRegion) =>
              setActiveRegionId(region.id)
            }
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {activeRegion && (
            <HealthBodyRegionView
              key={activeRegion.id}
              variant="xray"
              region={activeRegion}
              folders={regionFolders}
              creatingId={creatingId}
              onBack={() => setActiveRegionId(null)}
              onOpenFolder={(id) => {
                onSelectFolder(id);
                setActiveRegionId(null);
              }}
              onCreateFolder={handleCreate}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-[1] shrink-0 border-t border-cyan-500/10 px-4 py-2.5 text-center text-xs text-cyan-200/45">
        {activeRegion ? t('vault.healthSelectFolder') : t('vault.healthTapRegion')}
      </div>
    </div>
  );
}

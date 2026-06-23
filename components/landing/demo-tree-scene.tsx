'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { t } from '@/lib/i18n';
import type { DemoPhase } from '@/lib/demo-presets';
import { Connector, DemoNode } from './demo-shared';

interface DemoTreeSceneProps {
  phase: DemoPhase;
  highlightPath: boolean;
  showNewDoc: boolean;
  showPreviewPanel: boolean;
  searchActive: boolean;
}

export function DemoTreeScene({
  phase,
  highlightPath,
  showNewDoc,
  showPreviewPanel,
  searchActive,
}: DemoTreeSceneProps) {
  const dimAnalyze = phase === 'analyze';
  const pulseRoute = phase === 'route';
  const pathLit =
    highlightPath &&
    (phase === 'route' || phase === 'placed' || phase === 'preview' || phase === 'hold');

  return (
    <div className="py-2">
      <div className="flex items-start gap-3 sm:gap-4">
        <DemoNode
          nodeId="work"
          label={t('demo.work')}
          folderKind="work"
          accent
          highlighted={pathLit}
          dimmed={dimAnalyze}
        />

        <Connector />

        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <DemoNode
              nodeId="clients"
              label={t('demo.clients')}
              folderKind="clients"
              highlighted={pathLit}
              pulse={pulseRoute}
              dimmed={dimAnalyze}
            />
            <Connector />

            <div className="flex flex-col gap-5 sm:gap-6">
              <div className="flex items-start gap-3 sm:gap-3.5">
                <DemoNode
                  nodeId="acme"
                  label={t('demo.acme')}
                  folderKind="company"
                  highlighted={pathLit}
                  pulse={pulseRoute}
                  target={highlightPath}
                  dimmed={dimAnalyze}
                />
                <Connector short />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <DemoNode
                      nodeId="invoice"
                      label={t('demo.invoice')}
                      doc
                      filename="Invoice_Q1.pdf"
                      searchHit={searchActive}
                      compact
                    />
                    <DemoNode
                      nodeId="requirements"
                      label={t('demo.requirements')}
                      doc
                      filename="Requirements.docx"
                      compact
                    />
                  </div>
                  <div className="flex items-start gap-2 sm:gap-2.5">
                    <DemoNode
                      nodeId="websiteProject"
                      label={t('demo.websiteProject')}
                      folderKind="project"
                      highlighted={pathLit}
                      pulse={pulseRoute}
                      target={highlightPath}
                      compact
                    />
                    <Connector short />
                    <div className="flex flex-col gap-2">
                      <DemoNode nodeId="mockups" label={t('demo.mockups')} doc filename="Mockups.fig" compact />
                      <DemoNode nodeId="spec" label={t('demo.spec')} doc filename="Spec.pdf" compact />
                      <AnimatePresence>
                        {showNewDoc && (
                          <motion.div
                            initial={{ opacity: 0, x: -8, scale: 0.85 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                          >
                            <DemoNode
                              nodeId="amendment"
                              label={t('demo.amendment')}
                              doc
                              filename="Amendment.pdf"
                              newDoc
                              selected={showPreviewPanel}
                              compact
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-3.5">
                <DemoNode
                  nodeId="nordline"
                  label={t('demo.nordline')}
                  folderKind="company"
                  dimmed={dimAnalyze || highlightPath}
                  compact
                />
                <Connector short />
                <div className="flex flex-col gap-3">
                  <DemoNode nodeId="nda" label={t('demo.nda')} doc filename="NDA.pdf" compact />
                  <div className="flex items-start gap-2 sm:gap-2.5">
                    <DemoNode nodeId="q2Project" label={t('demo.q2Project')} folderKind="project" dimmed compact />
                    <Connector short />
                    <div className="flex flex-col gap-2">
                      <DemoNode nodeId="sprintPlan" label={t('demo.sprintPlan')} doc filename="Sprint_Plan.xlsx" compact />
                      <DemoNode nodeId="apiDocs" label={t('demo.apiDocs')} doc filename="API_Docs.pdf" compact />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <DemoNode
                  nodeId="brightCo"
                  label={t('demo.brightCo')}
                  folderKind="company"
                  dimmed={dimAnalyze || highlightPath}
                  compact
                />
                <Connector short />
                <DemoNode nodeId="contract" label={t('demo.contract')} doc filename="Contract.pdf" compact />
                <DemoNode nodeId="proposal" label={t('demo.proposal')} doc filename="Proposal.pdf" compact />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-3.5">
            <DemoNode
              nodeId="internal"
              label={t('demo.internal')}
              folderKind="default"
              dimmed={phase !== 'archive' && phase !== 'hold'}
              compact
            />
            <Connector short />
            <DemoNode nodeId="templates" label={t('demo.templates')} folderKind="documents" dimmed compact />
          </div>
        </div>
      </div>
    </div>
  );
}

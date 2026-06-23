'use client';

import { Connector, DemoNode } from './demo-shared';

/** Static mind-map preview for the hero — no animation. */
export function HeroMapSnapshot() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_32px_80px_rgba(0,0,0,0.08)]">
      <div className="mind-map-viewport absolute inset-0" />

      <div className="absolute left-0 right-0 top-0 z-10 flex h-9 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 backdrop-blur-sm">
        <span className="font-[family-name:var(--font-display)] text-xs sm:text-sm">Vault</span>
        <div className="ml-1 h-5 flex-1 max-w-[100px] rounded-md bg-[var(--color-surface-2)] sm:max-w-[120px]" />
        <div className="h-5 w-12 rounded-md bg-[var(--color-accent)] sm:w-14" />
      </div>

      <div className="absolute inset-0 top-9 flex items-center justify-center overflow-hidden p-4">
        <div className="origin-center scale-[0.62] sm:scale-[0.72] lg:scale-[0.8]">
          <div className="flex items-start gap-2 sm:gap-2.5">
            <DemoNode label="My Archive" folderKind="archive" accent />

            <Connector />

            <div className="flex flex-col gap-3 sm:gap-3.5">
              <div className="flex items-start gap-2 sm:gap-2.5">
                <DemoNode label="Work" folderKind="work" highlighted />
                <Connector short />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <DemoNode label="Projects" folderKind="project" compact />
                    <Connector short />
                    <DemoNode label="Brand Refresh" folderKind="project" compact />
                    <Connector short />
                    <div className="flex flex-col gap-1">
                      <DemoNode label="Brief.pdf" doc filename="Brief.pdf" compact />
                      <DemoNode label="Moodboard.png" doc filename="Moodboard.png" compact />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <DemoNode label="Invoices" folderKind="documents" compact />
                    <Connector short />
                    <DemoNode label="Q1_Report.pdf" doc filename="Q1_Report.pdf" compact />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <DemoNode label="Home" folderKind="home" compact />
                <Connector short />
                <DemoNode label="Utilities" folderKind="utilities" compact />
                <Connector short />
                <DemoNode label="Gas_Bill.pdf" doc filename="Gas_Bill.pdf" compact />
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <DemoNode label="Health" folderKind="health" compact />
                <Connector short />
                <DemoNode label="Labs 2025" folderKind="labs" compact />
                <Connector short />
                <DemoNode label="Blood_Test.pdf" doc filename="Blood_Test.pdf" compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

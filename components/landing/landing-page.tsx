'use client';

import { motion, useInView } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Brain,
  FolderTree,
  Lock,
  Map,
  Search,
  Shield,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { en } from '@/lib/i18n/en';
import { t } from '@/lib/i18n';
import { ProductDemo } from '@/components/landing/product-demo';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)]">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/80 bg-[var(--color-canvas)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Lock size={18} />
            </div>
            <span className="font-[family-name:var(--font-display)] text-lg">Vault</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[var(--color-muted)] md:flex">
            <a href="#features" className="transition hover:text-[var(--color-text)]">
              {t('landing.features')}
            </a>
            <a href="#how" className="transition hover:text-[var(--color-text)]">
              {t('landing.howItWorks')}
            </a>
            <a href="#pricing" className="transition hover:text-[var(--color-text)]">
              {t('landing.pricing')}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-[var(--color-muted)] transition hover:text-[var(--color-text)] sm:inline"
            >
              {t('landing.signIn')}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              {t('landing.startFree')}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[var(--color-accent-soft)] opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[var(--color-accent-soft)] opacity-40 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-accent-soft)] px-4 py-1.5 text-sm text-[var(--color-accent)]">
              <Sparkles size={14} />
              {t('landing.heroBadge')}
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-4xl leading-[1.1] tracking-tight md:text-5xl lg:text-[3.25rem]">
              {t('landing.heroTitle')}
              <br />
              <span className="text-[var(--color-accent)]">{t('landing.heroTitleAccent')}</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--color-muted)]">
              {t('landing.heroSubtitle')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-6 py-3.5 text-base font-medium text-white shadow-lg shadow-[var(--color-accent)]/20 transition hover:opacity-90"
              >
                {t('landing.createArchive')}
                <ArrowRight size={18} />
              </Link>
              <a
                href="#how"
                className="text-sm text-[var(--color-muted)] underline-offset-4 transition hover:text-[var(--color-text)] hover:underline"
              >
                {t('landing.seeHowItWorks')}
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-[var(--color-muted)]">
              <TrustItem icon={Shield} text={t('landing.trustFiles')} />
              <TrustItem icon={Zap} text={t('landing.trustAi')} />
              <TrustItem icon={Lock} text={t('landing.trustNoCard')} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <ProductDemo />
          </motion.div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="border-y border-[var(--color-border)] bg-[var(--color-surface)]/50 px-6 py-6">
        <p className="text-center text-sm text-[var(--color-muted)]">
          {t('landing.audience')}
        </p>
      </div>

      {/* Features */}
      <Section id="features" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {t('landing.features')}
          </p>
          <h2 className="mt-3 text-center font-[family-name:var(--font-display)] text-3xl md:text-4xl">
            {t('landing.featuresTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--color-muted)]">
            {t('landing.featuresSubtitle')}
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={FolderTree}
              title={t('landing.featureMindMapTitle')}
              description={t('landing.featureMindMapDesc')}
              delay={0}
            />
            <FeatureCard
              icon={Brain}
              title={t('landing.featureAiImportTitle')}
              description={t('landing.featureAiImportDesc')}
              delay={0.1}
            />
            <FeatureCard
              icon={Activity}
              title={t('landing.featureHealthTitle')}
              description={t('landing.featureHealthDesc')}
              delay={0.2}
              highlight
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Search}
              title={t('landing.featureSearchTitle')}
              description={t('landing.featureSearchDesc')}
              delay={0}
              compact
            />
            <FeatureCard
              icon={Sparkles}
              title={t('landing.featureAiCommandsTitle')}
              description={t('landing.featureAiCommandsDesc')}
              delay={0.1}
              compact
            />
            <FeatureCard
              icon={Upload}
              title={t('landing.featureDragDropTitle')}
              description={t('landing.featureDragDropDesc')}
              delay={0.2}
              compact
            />
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section
        id="how"
        className="border-y border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {t('landing.howItWorks')}
          </p>
          <h2 className="mt-3 text-center font-[family-name:var(--font-display)] text-3xl md:text-4xl">
            {t('landing.stepsTitle')}
          </h2>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <StepCard
              step={1}
              title={t('landing.step1Title')}
              description={t('landing.step1Desc')}
              icon={Upload}
            />
            <StepCard
              step={2}
              title={t('landing.step2Title')}
              description={t('landing.step2Desc')}
              icon={Sparkles}
            />
            <StepCard
              step={3}
              title={t('landing.step3Title')}
              description={t('landing.step3Desc')}
              icon={Map}
            />
          </div>
        </div>
      </Section>

      {/* Use cases */}
      <Section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-[family-name:var(--font-display)] text-3xl md:text-4xl">
            {t('landing.presetsTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[var(--color-muted)]">
            {t('landing.presetsSubtitle')}
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <UseCaseCard
              emoji="💼"
              title={t('landing.presetWorkTitle')}
              items={[...en.landing.presetWorkItems]}
            />
            <UseCaseCard
              emoji="🩺"
              title={t('landing.presetHealthTitle')}
              items={[...en.landing.presetHealthItems]}
              accent
            />
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section
        id="pricing"
        className="border-t border-[var(--color-border)] bg-[var(--color-accent-soft)]/40 px-6 py-20 md:py-28"
      >
        <div className="mx-auto max-w-lg text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{t('landing.pricing')}</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl md:text-4xl">
            {t('landing.pricingTitle')}
          </h2>
          <p className="mt-4 text-[var(--color-muted)]">
            {t('landing.pricingSubtitle')}
          </p>

          <div className="mt-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-lg">
            <p className="font-[family-name:var(--font-display)] text-5xl">{t('landing.pricingPrice')}</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{t('landing.pricingPriceNote')}</p>
            <ul className="mt-6 space-y-3 text-left text-sm">
              {en.landing.pricingFeatures.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--color-accent)]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] py-3.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              {t('landing.startFree')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl">
            {t('landing.ctaTitle')}
          </h2>
          <p className="mt-4 text-lg text-[var(--color-muted)]">
            {t('landing.ctaSubtitle')}
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-8 py-4 text-base font-medium text-white shadow-lg transition hover:opacity-90"
          >
            {t('landing.createArchive')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Lock size={14} />
            <span>{t('landing.footer')}</span>
          </div>
          <div className="flex gap-6 text-sm text-[var(--color-muted)]">
            <Link href="/login" className="transition hover:text-[var(--color-text)]">
              {t('landing.signIn')}
            </Link>
            <a href="#features" className="transition hover:text-[var(--color-text)]">
              {t('landing.features')}
            </a>
            <a href="#pricing" className="transition hover:text-[var(--color-text)]">
              {t('landing.pricing')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  text: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <Icon size={15} className="text-[var(--color-accent)]" />
      {text}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
  highlight,
  compact,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  delay?: number;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        'rounded-2xl border p-6 transition',
        highlight
          ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/50'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]',
        compact && 'p-5',
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-10 w-10 items-center justify-center rounded-xl',
          highlight ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
        )}
      >
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{description}</p>
    </motion.div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="relative text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <Icon size={24} />
      </div>
      <span className="mt-4 inline-block rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
        {t('common.step', { step })}
      </span>
      <h3 className="mt-3 text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{description}</p>
    </div>
  );
}

function UseCaseCard({
  emoji,
  title,
  items,
  accent,
}: {
  emoji: string;
  title: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-6',
        accent
          ? 'border-[var(--color-accent)]/25 bg-[var(--color-accent-soft)]/30'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]',
      )}
    >
      <span className="text-3xl">{emoji}</span>
      <h3 className="mt-3 text-xl font-medium">{title}</h3>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

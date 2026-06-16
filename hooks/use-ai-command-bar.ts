'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AiPlanAction, AiPlanResponse, AiSettings, UpdateAiSettingsPayload } from '@/lib/types';
import { useVaultMutations } from '@/hooks/use-vault-data';

export type AiCommandBarState = 'idle' | 'loading' | 'confirm' | 'executing';

export function useAiCommandBar() {
  const { invalidate } = useVaultMutations();
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [state, setState] = useState<AiCommandBarState>('idle');
  const [pendingPlan, setPendingPlan] = useState<AiPlanResponse | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const data = await api.getAiSettings();
    setSettings(data);
    return data;
  }, []);

  useEffect(() => {
    loadSettings().catch(() => undefined);
  }, [loadSettings]);

  const saveSettings = useCallback(async (payload: UpdateAiSettingsPayload) => {
    const data = await api.updateAiSettings(payload);
    setSettings(data);
    return data;
  }, []);

  const submitCommand = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setState('loading');
    setError(null);
    setFeedback(null);
    setPendingPlan(null);

    try {
      const plan = await api.planAiCommand(trimmed);
      if (plan.actions.length === 0) {
        setFeedback(plan.reply);
        setState('idle');
        return;
      }
      setPendingPlan(plan);
      setState('confirm');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обработать команду');
      setState('idle');
    }
  }, []);

  const confirmPlan = useCallback(async () => {
    if (!pendingPlan?.actions.length) return;

    setState('executing');
    setError(null);

    try {
      const result = await api.executeAiPlan(pendingPlan.actions);
      await invalidate();
      const summary =
        result.executedActions[0] ??
        pendingPlan.reply ??
        result.reply;
      setFeedback(summary);
      setPendingPlan(null);
      setState('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить команду');
      setState('confirm');
    }
  }, [invalidate, pendingPlan]);

  const dismissPlan = useCallback(() => {
    setPendingPlan(null);
    setState('idle');
    setError(null);
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
    setError(null);
  }, []);

  return {
    settings,
    state,
    pendingPlan,
    feedback,
    error,
    loadSettings,
    saveSettings,
    submitCommand,
    confirmPlan,
    dismissPlan,
    clearFeedback,
  };
}

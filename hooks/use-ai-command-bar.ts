'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import { resolveUserError, type UserFacingError } from '@/lib/errors';
import type { AiPlanResponse } from '@/lib/types';
import { useVaultMutations } from '@/hooks/use-vault-data';

export type AiCommandBarState = 'idle' | 'loading' | 'confirm' | 'executing';

export function useAiCommandBar() {
  const { invalidate } = useVaultMutations();
  const [state, setState] = useState<AiCommandBarState>('idle');
  const [pendingPlan, setPendingPlan] = useState<AiPlanResponse | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<UserFacingError | null>(null);

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
      setError(resolveUserError(e));
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
      setError(resolveUserError(e));
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
    state,
    pendingPlan,
    feedback,
    error,
    submitCommand,
    confirmPlan,
    dismissPlan,
    clearFeedback,
  };
}

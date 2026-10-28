import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSeedState,
  isMandatory,
  poolHandoffs,
  type Handoff,
  type LedgerEntry,
  type ReviewState,
} from "@/lib/model";

const STORAGE_KEY = "blindspot.review.v3";

const loadState = (): ReviewState => {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as ReviewState;
    if (!Array.isArray(parsed.handoffs) || !Array.isArray(parsed.ledger)) {
      return createSeedState();
    }
    return parsed;
  } catch {
    return createSeedState();
  }
};

const withHandoff = (
  state: ReviewState,
  id: string,
  update: (handoff: Handoff) => Handoff
): ReviewState => ({
  ...state,
  handoffs: state.handoffs.map((handoff) =>
    handoff.id === id ? update(handoff) : handoff
  ),
});

export const openGaps = (handoff: Handoff) =>
  handoff.gaps.filter((gap) => gap.state === "open");

export const canApprove = (handoff: Handoff) =>
  openGaps(handoff).length === 0 &&
  (handoff.status === "awaiting" || handoff.status === "testing");

export function useReview() {
  const [state, setState] = useState<ReviewState>(loadState);
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const stateRef = useRef(state);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    stateRef.current = state;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable in private windows; the demo still works in memory.
    }
  }, [state]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    []
  );

  const settle = useCallback((handoffId: string, gapId: string, failed: boolean) => {
    setState((prev) => {
      const handoff = prev.handoffs.find((item) => item.id === handoffId);
      const gap = handoff?.gaps.find((item) => item.id === gapId);
      if (!handoff || !gap) return prev;

      const entry: LedgerEntry = {
        id: `l-${Date.now()}-${gapId}`,
        at: Date.now(),
        handoffId,
        target: handoff.target,
        gapClass: gap.cls,
        assumption: gap.assumption,
        plain: gap.ask,
        outcome: failed ? "falsified" : "verified",
      };

      const next = withHandoff(prev, handoffId, (current) => ({
        ...current,
        status: failed
          ? "revised"
          : current.status === "testing"
            ? "awaiting"
            : current.status,
        revision: failed
          ? `A check proved this claim wrong. ${gap.test.failPlain ?? gap.test.failOutput} The agent has to re-scope and come back with proof, so this request cannot be approved as it stands.`
          : current.revision,
        gaps: current.gaps.map((item) =>
          item.id === gapId
            ? { ...item, state: failed ? "falsified" : "verified" }
            : item
        ),
      }));

      return { ...next, ledger: [entry, ...prev.ledger] };
    });
  }, []);

  const runGap = useCallback(
    (handoffId: string, gapId: string) => {
      const handoff = stateRef.current.handoffs.find((item) => item.id === handoffId);
      const gap = handoff?.gaps.find((item) => item.id === gapId);
      if (!gap || gap.state !== "open" || running[gapId]) return;

      setRunning((prev) => ({ ...prev, [gapId]: true }));
      const timer = window.setTimeout(() => {
        settle(handoffId, gapId, gap.test.willFail);
        setRunning((prev) => {
          const next = { ...prev };
          delete next[gapId];
          return next;
        });
      }, gap.test.durationMs);
      timers.current.push(timer);
    },
    [running, settle]
  );

  const acceptRisk = useCallback((handoffId: string, gapId: string) => {
    setState((prev) => {
      const handoff = prev.handoffs.find((item) => item.id === handoffId);
      const gap = handoff?.gaps.find((item) => item.id === gapId);
      if (!handoff || !gap || gap.state !== "open") return prev;
      if (isMandatory(prev.ledger, gap.cls)) return prev;

      const entry: LedgerEntry = {
        id: `l-${Date.now()}-${gapId}`,
        at: Date.now(),
        handoffId,
        target: handoff.target,
        gapClass: gap.cls,
        assumption: gap.assumption,
        plain: gap.ask,
        outcome: "accepted-risk",
      };

      const next = withHandoff(prev, handoffId, (current) => ({
        ...current,
        gaps: current.gaps.map((item) =>
          item.id === gapId ? { ...item, state: "accepted" } : item
        ),
      }));
      return { ...next, ledger: [entry, ...prev.ledger] };
    });
  }, []);

  const demandProof = useCallback(
    (handoffId: string) => {
      const handoff = stateRef.current.handoffs.find((item) => item.id === handoffId);
      if (!handoff) return;
      const pending = [...handoff.gaps]
        .filter((gap) => gap.state === "open")
        .sort((a, b) => b.impact * b.likelihood - a.impact * a.likelihood)[0];
      if (!pending) return;

      setState((prev) =>
        withHandoff(prev, handoffId, (current) => ({
          ...current,
          status: "testing",
        }))
      );

      const timer = window.setTimeout(() => {
        runGap(handoffId, pending.id);
      }, 700);
      timers.current.push(timer);
    },
    [runGap]
  );

  const decide = useCallback((handoffId: string, verdict: "approved" | "rejected") => {
    setState((prev) =>
      withHandoff(prev, handoffId, (current) => ({
        ...current,
        status: verdict,
        decision: {
          verdict,
          at: Date.now(),
          acceptedRisks: current.gaps.filter((gap) => gap.state === "accepted").length,
        },
      }))
    );
  }, []);

  const simulateHandoff = useCallback(() => {
    const previous = stateRef.current;
    const now = Date.now();
    const pool = poolHandoffs(now);
    const next = { ...pool[previous.poolIndex % pool.length], createdAt: now };
    setState({
      ...previous,
      handoffs: [next, ...previous.handoffs],
      poolIndex: previous.poolIndex + 1,
    });
    return next.id;
  }, []);

  const reset = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setRunning({});
    const seed = createSeedState();
    setState(seed);
  }, []);

  return {
    state,
    running,
    runGap,
    acceptRisk,
    demandProof,
    decide,
    simulateHandoff,
    reset,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MousePointerClick, X } from "lucide-react";

type TourStep = {
  target: string;
  title: string;
  body: string;
  action?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="request"]',
    title: "This is the agent's request",
    body:
      "Read it like a sentence: what it says it did, and why it wants permission to ship. It sounds confident — that is the point.",
  },
  {
    target: '[data-tour="gaps"]',
    title: "Here is what it did not check",
    body:
      "Every assumption the work depends on, biggest risk first. Each one is a place where the whole fix can be wrong.",
  },
  {
    target: '[data-tour="first-check"]',
    title: "Check it yourself",
    body:
      "Press “Run the check”. It takes about two seconds, and it needs no code reading.",
    action: true,
  },
  {
    target: '[data-tour="first-result"]',
    title: "The agent was wrong",
    body:
      "It tested a version of the site that is 61 updates behind. You just caught a bad claim before it cost anyone anything.",
  },
  {
    target: '[data-tour="required"]',
    title: "So it becomes a rule",
    body:
      "The same check wrong twice and it is required on every future request in this workspace. That is how the workspace learns.",
  },
  {
    target: '[data-tour="decide"]',
    title: "Now you decide",
    body:
      "Approving needs every blind spot answered and a claim that still holds. This one was proven wrong, so the honest move is to send it back. Either way, your call is recorded.",
  },
];

function findVisible(selector: string): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return (
    nodes.find((node) => {
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    }) ?? null
  );
}

export function Tour({
  open,
  actionDone,
  onClose,
}: {
  open: boolean;
  actionDone: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tipHeight, setTipHeight] = useState(196);
  const tipRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const measuredOnce = useRef(false);

  const step = TOUR_STEPS[index];

  const measure = useCallback(() => {
    const node = findVisible(TOUR_STEPS[index].target);
    setRect(node ? node.getBoundingClientRect() : null);
  }, [index]);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    measuredOnce.current = false;
    window.clearTimeout(advanceTimer.current);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = findVisible(step.target);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node?.scrollIntoView({
      block: "center",
      inline: "center",
      behavior: reduced || measuredOnce.current ? "auto" : "smooth",
    });
    measuredOnce.current = true;

    measure();
    const timers = [60, 240, 520, 900].map((delay) => window.setTimeout(measure, delay));
    const onScroll = () => measure();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, index, step.target, measure]);

  useEffect(() => {
    if (!open) return;
    const element = tipRef.current;
    if (element) setTipHeight(element.offsetHeight);
  }, [open, index]);

  useEffect(() => {
    if (!open || !step.action || !actionDone) return;
    advanceTimer.current = window.setTimeout(() => {
      setIndex((current) => Math.min(current + 1, TOUR_STEPS.length - 1));
    }, 900);
    return () => window.clearTimeout(advanceTimer.current);
  }, [open, step.action, actionDone]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(current + 1, TOUR_STEPS.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(current - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 7;
  const box = rect
    ? {
        left: Math.max(4, rect.left - pad),
        top: Math.max(4, rect.top - pad),
        width: Math.min(vw - 8, rect.width + pad * 2),
        height: Math.min(vh - 8, rect.height + pad * 2),
      }
    : null;

  const tipWidth = Math.min(344, vw - 24);
  const placeBelow = !box || box.top + box.height + tipHeight + 24 < vh;
  const tipTop = box
    ? placeBelow
      ? Math.min(vh - tipHeight - 12, box.top + box.height + 14)
      : Math.max(12, box.top - tipHeight - 14)
    : vh - tipHeight - 16;
  const tipLeft = box
    ? Math.min(vw - tipWidth - 12, Math.max(12, box.left + box.width / 2 - tipWidth / 2))
    : (vw - tipWidth) / 2;

  const isLast = index === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none" aria-live="polite">
      {box ? (
        <div
          className="tour-spot pointer-events-none fixed rounded-[18px] border-2 border-primary/80 transition-all duration-300 ease-out"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            boxShadow: "0 0 0 9999px rgba(11, 23, 51, 0.62)",
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="fixed inset-0 bg-[#0b1733]/62" aria-hidden="true" />
      )}

      <div
        ref={tipRef}
        className="tour-tip pointer-events-auto fixed rounded-[20px] border border-border bg-card p-4 shadow-[0_24px_60px_rgba(11,23,51,0.35)]"
        style={{ left: tipLeft, top: tipTop, width: tipWidth }}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="zk-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
            Walkthrough · {index + 1} of {TOUR_STEPS.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="End walkthrough"
            className="-mr-1 -mt-1 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-chip hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <h3 id="tour-title" className="zk-display mt-1.5 text-[17px] font-extrabold leading-snug text-foreground">
          {step.title}
        </h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-text2">{step.body}</p>

        {step.action ? (
          <div className="mt-3 flex items-center gap-2 rounded-[12px] border border-warn-line bg-warn-bg px-3 py-2">
            <MousePointerClick className="size-3.5 shrink-0 text-warn" aria-hidden="true" />
            <p className="text-[11.5px] font-bold text-warn">
              {actionDone ? "Nice. That is the whole job." : "Waiting for you to press Run the check."}
            </p>
          </div>
        ) : null}

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIndex((current) => Math.max(current - 1, 0))}
            disabled={index === 0}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11.5px] font-bold text-text2 transition-colors hover:bg-chip hover:text-foreground disabled:opacity-40"
          >
            <ArrowLeft className="size-3" aria-hidden="true" />
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLast) onClose();
              else setIndex((current) => Math.min(current + 1, TOUR_STEPS.length - 1));
            }}
            disabled={step.action && !actionDone}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11.5px] font-bold text-primary-foreground transition-colors hover:bg-[#2867e5] disabled:opacity-35"
          >
            {isLast ? "Try it yourself" : step.action ? "Waiting…" : "Next"}
            {isLast ? null : <ArrowRight className="size-3" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Eye, Lock, Play, ShieldCheck, X } from "lucide-react";

type Step = 0 | 1 | 2 | 3;

const DOTS: Step[] = [0, 1, 2, 3];

function AgentBubble() {
  return (
    <div className="rounded-[20px] border border-border bg-background p-4 shadow-card">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground">
          AI
        </span>
        <div>
          <p className="text-[12.5px] font-bold text-foreground">AI agent</p>
          <p className="zk-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
            contributor · just now
          </p>
        </div>
        <span className="ml-auto rounded-full bg-ok-bg px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.05em] text-ok">
          Done
        </span>
      </div>
      <p className="mt-3 text-[13.5px] font-semibold leading-relaxed text-foreground">
        “Saved filters are dropped on refresh. Found the cause — fix is ready. Safe to ship.”
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-[12px] border border-dashed border-[#c9d6ef] bg-card px-3 py-2">
        <Eye className="size-3.5 text-primary" aria-hidden="true" />
        <p className="text-[11.5px] font-semibold text-text2">
          What it will not mention: what it did not check.
        </p>
      </div>
    </div>
  );
}

const BLIND_SPOTS = [
  { label: "Wrong version tested", risk: "High", tone: "bad" },
  { label: "Wrong repo", risk: "High", tone: "bad" },
  { label: "Maybe already reported", risk: "Medium", tone: "warn" },
];

function BlindSpotList() {
  return (
    <div className="flex flex-col gap-2">
      <p className="zk-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        3 things it did not check
      </p>
      {BLIND_SPOTS.map((spot, index) => (
        <div
          key={spot.label}
          className="flex items-center gap-3 rounded-[14px] border border-border bg-background px-3.5 py-3"
        >
          <span className="zk-mono flex size-6 shrink-0 items-center justify-center rounded-full bg-chip text-[10px] font-bold text-text2">
            {index + 1}
          </span>
          <span className="flex-1 text-[12.5px] font-bold text-foreground">{spot.label}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.04em] ${
              spot.tone === "bad" ? "bg-bad-bg text-bad" : "bg-warn-bg text-warn"
            }`}
          >
            {spot.risk} risk
          </span>
        </div>
      ))}
      <p className="px-1 text-[11.5px] leading-relaxed text-muted-foreground">
        If any of these is wrong, the whole fix is wrong. The message never says so.
      </p>
    </div>
  );
}

function MiniCheck() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = () => {
    if (phase !== "idle") return;
    setPhase("running");
    timer.current = window.setTimeout(() => setPhase("done"), 900);
  };

  return (
    <div className="rounded-[18px] border border-border bg-background p-4">
      <p className="zk-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Blind spot 1 · wrong version tested
      </p>
      <p className="mt-2 text-[13px] font-bold leading-snug text-foreground">
        It is testing the version of the site that is actually live.
      </p>
      {phase === "done" ? (
        <div className="mt-3 rounded-[14px] border border-bad-line bg-bad-bg px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-bad">
            <X className="size-3.5" aria-hidden="true" />
            It was wrong
          </p>
          <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-[#7f1d12]">
            The live site is 61 updates behind the code the agent tested. You caught it before
            anyone paid for it.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={run}
          disabled={phase === "running"}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-[12.5px] font-bold text-primary-foreground shadow-primary transition-colors hover:bg-[#2867e5] disabled:opacity-80"
        >
          {phase === "running" ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              Checking…
            </>
          ) : (
            <>
              <Play className="size-3.5" aria-hidden="true" />
              Run the 2-second check
            </>
          )}
        </button>
      )}
      <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
        No code reading. One click. Anyone can do this.
      </p>
    </div>
  );
}

function RuleList() {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-[14px] border border-bad-line bg-bad-bg px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] font-bold text-[#7f1d12]">Wrong version tested</span>
          <span className="zk-mono rounded-full bg-card px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.04em] text-bad">
            2 times
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#7f1d12]">
          <Lock className="size-3" aria-hidden="true" />
          Now required on every request
        </p>
      </div>
      <div className="rounded-[14px] border border-border bg-background px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] font-bold text-foreground">Risk you accepted</span>
          <span className="zk-mono rounded-full bg-chip px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.04em] text-text2">
            On the record
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground">
          <ShieldCheck className="size-3" aria-hidden="true" />
          Kept forever, so nobody relies on memory
        </p>
      </div>
      <p className="px-1 text-[11.5px] leading-relaxed text-muted-foreground">
        This is the part that compounds: the workspace gets safer every time you use it.
      </p>
    </div>
  );
}

const COPY = [
  {
    kicker: "A 40-second demo",
    title: "Your AI just said: “Done. Ship it.”",
    body:
      "It might be right. But its message will never mention the things it did not check — and that is where the expensive mistakes live.",
  },
  {
    kicker: "Step 1 · show the blind spots",
    title: "Before you can approve, it lists its guesses.",
    body:
      "Every assumption the work depends on, biggest risk first — including what happens if the assumption is wrong.",
  },
  {
    kicker: "Step 2 · check it yourself",
    title: "Each guess comes with a 2-second check.",
    body:
      "Run it yourself. No code reading. If the agent was wrong, you find out before it ships.",
  },
  {
    kicker: "Step 3 · never twice",
    title: "Your decision becomes a rule.",
    body:
      "The same check wrong twice can never be skipped again. Every risk you take stays on the record. Nobody has to remember.",
  },
];

export function StoryIntro({
  open,
  onClose,
  onStartTour,
}: {
  open: boolean;
  onClose: () => void;
  onStartTour: () => void;
}) {
  const [step, setStep] = useState<Step>(0);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timedForward = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    window.clearTimeout(timedForward.current);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    primaryRef.current?.focus();
  }, [open, step]);

  useEffect(() => () => window.clearTimeout(timedForward.current), []);

  if (!open) return null;

  const copy = COPY[step];
  const isLast = step === 3;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[#0b1733]/65 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
    >
      <div className="intro-card relative my-auto w-full max-w-[820px] overflow-hidden rounded-[26px] border border-border bg-card shadow-[0_40px_120px_rgba(11,23,51,0.4)]">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#3978f6,#7aa7ff,#eaf2fe)]" />

        <div className="flex items-center justify-between gap-3 px-5 pt-4 sm:px-7">
          <div className="flex items-center gap-1.5">
            <img src="/brand/ziki-mark.png" alt="Ziki" className="h-[18px] w-[22px] object-contain" />
            <span className="text-[15px] font-extrabold tracking-[-0.05em] text-foreground">ziki</span>
            <span className="ml-1 rounded-full bg-tint px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.05em] text-primary">
              Blindspot
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-[11.5px] font-bold text-muted-foreground transition-colors hover:bg-chip hover:text-foreground"
          >
            Skip intro
          </button>
        </div>

        <div className="grid gap-5 px-5 pb-5 pt-4 sm:grid-cols-[1.02fr_0.98fr] sm:gap-6 sm:px-7 sm:pb-6">
          <div className="flex flex-col">
            <p className="zk-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
              {copy.kicker}
            </p>
            <h2
              id="intro-title"
              className="zk-display mt-2 text-[26px] font-extrabold leading-[1.1] text-foreground sm:text-[32px]"
            >
              {copy.title}
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-text2 sm:text-[14.5px]">
              {copy.body}
            </p>

            <div className="mt-5 flex items-center gap-2 sm:mt-auto sm:pt-6">
              <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
                {DOTS.map((dot) => (
                  <span
                    key={dot}
                    className={`h-1.5 rounded-full transition-all ${
                      dot === step ? "w-6 bg-primary" : dot < step ? "w-3 bg-primary/40" : "w-3 bg-border"
                    }`}
                  />
                ))}
              </div>
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => (current - 1) as Step)}
                  className="rounded-full border border-border bg-card px-3.5 py-2 text-[12px] font-bold text-text2 transition-colors hover:bg-chip hover:text-foreground"
                >
                  Back
                </button>
              ) : null}
              {isLast ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="hidden rounded-full border border-border bg-card px-3.5 py-2 text-[12px] font-bold text-text2 transition-colors hover:bg-chip hover:text-foreground sm:block"
                  >
                    Explore alone
                  </button>
                  <button
                    ref={primaryRef}
                    type="button"
                    onClick={onStartTour}
                    className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[12.5px] font-bold text-primary-foreground shadow-primary transition-colors hover:bg-[#2867e5]"
                  >
                    Walk me through it
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <button
                  ref={primaryRef}
                  type="button"
                  onClick={() => setStep((current) => (current + 1) as Step)}
                  className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[12.5px] font-bold text-primary-foreground shadow-primary transition-colors hover:bg-[#2867e5]"
                >
                  {step === 0 ? "Show me how" : "Next"}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="min-w-0">
            {step === 0 ? <AgentBubble /> : null}
            {step === 1 ? <BlindSpotList /> : null}
            {step === 2 ? <MiniCheck /> : null}
            {step === 3 ? <RuleList /> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider bg-background/70 px-5 py-3 sm:px-7">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Check className="size-3 text-ok" aria-hidden="true" />
            Working demo · nothing leaves this browser
          </p>
          {isLast ? (
            <button
              type="button"
              onClick={onClose}
              className="text-[11.5px] font-bold text-primary transition-colors hover:text-[#2867e5] sm:hidden"
            >
              Explore on my own
            </button>
          ) : (
            <p className="zk-mono hidden text-[9px] uppercase tracking-[0.1em] text-muted-foreground sm:block">
              Built for Ziki agents
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, Moon, Sun, X } from "lucide-react";
import { GapSheet } from "@/components/gap-sheet";
import { HandoffQueue } from "@/components/handoff-queue";
import { useReview } from "@/hooks/use-review";
import { useTheme } from "@/hooks/use-theme";
import { GAP_CLASS_PLAIN, policiesOf } from "@/lib/model";

function useToast() {
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: "ok" | "info" | "warn";
  } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const flash = useCallback((message: string, tone: "ok" | "info" | "warn" = "ok") => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    timer.current = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer.current);
  }, [toast]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { toast, setToast, flash };
}

export default function App() {
  const review = useReview();
  const { theme, toggle: toggleTheme } = useTheme();
  const [selectedId, setSelectedId] = useState("");
  const { toast, setToast, flash } = useToast();

  const handoffs = review.state.handoffs;
  const selected = handoffs.find((handoff) => handoff.id === selectedId);
  const required = policiesOf(review.state.ledger).filter((policy) => policy.mandatory);

  const openRequest = (id: string) => {
    setSelectedId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeRequest = () => {
    setSelectedId("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[760px] items-center gap-2 px-4">
          {selected ? (
            <>
              <button
                type="button"
                onClick={closeRequest}
                className="-ml-1 flex h-9 items-center gap-1.5 rounded-full pl-1 pr-2 text-[12.5px] font-bold text-text2 transition-colors hover:text-primary"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                All requests
              </button>
              <span className="ml-1 hidden rounded-full bg-tint px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.06em] text-primary sm:inline">
                Blindspot
              </span>
            </>
          ) : (
            <>
              <img
                src="/brand/ziki-mark.png"
                alt="Ziki"
                className="h-[21px] w-[25px] object-contain"
              />
              <span className="text-[16px] font-extrabold tracking-[-0.04em] text-foreground">
                ziki
              </span>
              <span className="ml-1 rounded-full bg-tint px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.06em] text-primary">
                Blindspot
              </span>
            </>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-text2 transition-colors hover:border-primary/40 hover:text-primary"
          >
            {theme === "dark" ? (
              <Sun className="size-3.5" aria-hidden="true" />
            ) : (
              <Moon className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] px-4 py-6 sm:py-9">
        {selected ? (
          <GapSheet
            handoff={selected}
            ledger={review.state.ledger}
            running={review.running}
            onRunGap={review.runGap}
            onAcceptGap={(handoffId, gapId) => {
              review.acceptRisk(handoffId, gapId);
              flash("Risk accepted. It is now on the record.", "warn");
            }}
            onDecide={(handoffId, verdict) => {
              review.decide(handoffId, verdict);
              flash(
                verdict === "approved"
                  ? "Approved. This work can ship."
                  : "Sent back. Nothing ships until the agent fixes it.",
                verdict === "approved" ? "ok" : "info"
              );
            }}
            onBack={closeRequest}
          />
        ) : (
          <>
            <p className="zk-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-primary">
              Your review desk
            </p>
            <h1 className="zk-display mt-1.5 text-[30px] font-extrabold leading-tight text-foreground sm:text-[34px]">
              {handoffs.length} requests need your decision
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-text2">
              Each one is an AI agent asking to ship its work. Open a request, see what the agent
              did not check, then approve it or send it back.
            </p>

            <div className="mt-6">
              <HandoffQueue handoffs={handoffs} onSelect={openRequest} />
            </div>

            <details className="group mt-5 rounded-[14px] border border-border bg-card px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11.5px] font-bold text-text2 transition-colors hover:text-primary">
                <ChevronDown
                  className="size-3 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
                Why some items say "Required now"
              </summary>
              <div className="mt-2.5 text-[12px] leading-relaxed text-text2">
                <p>
                  Every decision is kept in a record. When the same kind of check is wrong twice,
                  it becomes mandatory before any agent can ask you again.
                </p>
                {required.length === 0 ? (
                  <p className="mt-2 text-muted-foreground">No rules are required yet.</p>
                ) : (
                  <p className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-foreground">Required so far:</span>
                    {required.map((policy) => (
                      <span
                        key={policy.cls}
                        className="zk-mono rounded-full bg-bad-bg px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.04em] text-bad"
                      >
                        {GAP_CLASS_PLAIN[policy.cls] ?? policy.cls} ({policy.incidents}×)
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </details>
          </>
        )}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[760px] flex-wrap items-center justify-between gap-2 px-4 py-4">
          <p className="zk-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
            Working demo · your decisions stay in this browser
          </p>
          <p className="text-[11.5px] font-semibold text-text2">Approve what you can explain.</p>
        </div>
      </footer>

      {toast ? (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="toast-in fixed inset-x-4 bottom-20 z-[95] mx-auto flex w-auto max-w-[420px] items-center gap-2.5 rounded-full border border-ink-border bg-ink px-4 py-3 text-[12.5px] font-semibold text-white shadow-[0_18px_48px_rgba(11,23,51,0.4)] sm:bottom-24"
        >
          <span
            className={`size-2 shrink-0 rounded-full ${
              toast.tone === "ok" ? "bg-[#5ee0a0]" : toast.tone === "warn" ? "bg-[#f0cd72]" : "bg-sky"
            }`}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[#8598bb] transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

import { ChevronRight } from "lucide-react";
import { openGaps } from "@/hooks/use-review";
import { regretBand, RISK_WORD, timeAgo, type Handoff } from "@/lib/model";

const LABEL: Record<Handoff["status"], { text: string; className: string }> = {
  awaiting: { text: "Waiting for you", className: "bg-info-bg text-info" },
  testing: { text: "Proof asked", className: "bg-warn-bg text-warn" },
  revised: { text: "Needs revision", className: "bg-bad-bg text-bad" },
  approved: { text: "Approved", className: "bg-ok-bg text-ok" },
  rejected: { text: "Sent back", className: "bg-chip text-muted-foreground" },
};

const RISK_COLOR: Record<ReturnType<typeof regretBand>, string> = {
  low: "var(--zk-ok-fg)",
  moderate: "var(--zk-warn-fg)",
  elevated: "var(--zk-bad-fg)",
  severe: "var(--zk-bad-fg)",
};

export function HandoffQueue({
  handoffs,
  onSelect,
  emptyLabel = "No requests right now.",
}: {
  handoffs: Handoff[];
  onSelect: (id: string) => void;
  emptyLabel?: string;
}) {
  const queue = [...handoffs].sort((a, b) => b.createdAt - a.createdAt);

  if (queue.length === 0) {
    return (
      <p className="rounded-[16px] border border-dashed border-border bg-card px-4 py-8 text-center text-[12.5px] font-medium text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {queue.map((handoff) => {
        const open = openGaps(handoff).length;
        const worst = handoff.gaps.reduce(
          (best, gap) => (gap.state === "open" ? Math.max(best, gap.impact * gap.likelihood) : best),
          0
        );
        const band =
          worst >= 16 ? "severe" : worst >= 10 ? "elevated" : worst >= 5 ? "moderate" : "low";
        const label = LABEL[handoff.status];
        return (
          <li key={handoff.id}>
            <button
              type="button"
              onClick={() => onSelect(handoff.id)}
              className="w-full rounded-[18px] border border-border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="zk-mono truncate text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {handoff.target}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.06em] ${label.className}`}
                >
                  {label.text}
                </span>
              </div>

              <p className="mt-2.5 text-[15px] font-semibold leading-snug text-foreground sm:text-[16px]">
                {handoff.plainClaim ?? handoff.claim}
              </p>

              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-divider pt-3">
                <span className="truncate text-[11.5px] font-medium text-muted-foreground">
                  {handoff.agent} · asked {timeAgo(handoff.createdAt)}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {open > 0 ? (
                    <>
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: RISK_COLOR[band] }}
                        aria-hidden="true"
                      />
                      <span className="zk-mono text-[9.5px] font-semibold uppercase tracking-[0.04em] text-text2">
                        {open} to check · {RISK_WORD[band]} risk
                      </span>
                    </>
                  ) : (
                    <span className="zk-mono text-[9.5px] uppercase tracking-[0.04em] text-muted-foreground">
                      all answered
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 text-[11.5px] font-bold text-primary">
                    Open
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </span>
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

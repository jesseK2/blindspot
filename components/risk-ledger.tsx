import {
  GAP_CLASS_LABEL,
  GAP_CLASS_PLAIN,
  GAP_CLASS_WHY,
  MANDATORY_THRESHOLD,
  policiesOf,
  stampTime,
  type LedgerEntry,
} from "@/lib/model";

const OUTCOME: Record<LedgerEntry["outcome"], { label: string; className: string }> = {
  verified: { label: "Held up", className: "bg-ok-bg text-ok" },
  falsified: { label: "Was wrong", className: "bg-bad-bg text-bad" },
  "accepted-risk": { label: "Risk taken", className: "bg-warn-bg text-warn" },
};

function Metric({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="rounded-[16px] border border-border bg-card px-5 py-4 shadow-card">
      <p
        className={`zk-display text-[30px] font-extrabold leading-none ${
          accent && value > 0 ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-[10px] font-semibold leading-snug text-muted-foreground">{label}</p>
    </div>
  );
}

function PolicyRow({ policy }: { policy: ReturnType<typeof policiesOf>[number] }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider px-5 py-4 first:border-t-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-1 flex gap-[3px]" aria-hidden="true">
          {Array.from({ length: MANDATORY_THRESHOLD }).map((_, index) => (
            <span
              key={index}
              className="h-3.5 w-[5px] rounded-full"
              style={{ backgroundColor: index < policy.incidents ? "#a3261a" : "#e3e8f2" }}
            />
          ))}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-foreground">
            {GAP_CLASS_PLAIN[policy.cls] ?? policy.cls}
            <span className="zk-mono ml-2 text-[9px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
              {GAP_CLASS_LABEL[policy.cls] ?? policy.cls}
            </span>
          </p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
            {GAP_CLASS_WHY[policy.cls] ?? ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="zk-mono text-[9.5px] uppercase tracking-[0.05em] text-muted-foreground">
          {policy.incidents === 0
            ? "no mistakes yet"
            : `${policy.incidents} ${policy.incidents === 1 ? "mistake" : "mistakes"}`}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.05em] ${
            policy.mandatory ? "bg-bad-bg text-bad" : "bg-chip text-muted-foreground"
          }`}
        >
          {policy.mandatory ? "Required" : "Watch list"}
        </span>
      </div>
    </div>
  );
}

export function RiskLedger({ ledger }: { ledger: LedgerEntry[] }) {
  const policies = policiesOf(ledger);
  const accepted = ledger.filter((entry) => entry.outcome === "accepted-risk").length;
  const falsified = ledger.filter((entry) => entry.outcome === "falsified").length;
  const verified = ledger.filter((entry) => entry.outcome === "verified").length;
  const required = policies.filter((policy) => policy.mandatory);
  const watching = policies.filter((policy) => !policy.mandatory);
  const mandatory = required.length;

  return (
    <div className="flex flex-col gap-7">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric value={accepted} label="Risks you took" />
        <Metric value={falsified} label="Times the agent was wrong" />
        <Metric value={verified} label="Checks that held up" />
        <Metric value={mandatory} label="Rules now required" accent />
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[14px] font-bold text-foreground">Checks we now require</h2>
          <p className="zk-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
            two mistakes of one kind make it a rule
          </p>
        </div>
        <div className="mt-3 overflow-hidden rounded-[18px] border border-border bg-card shadow-card">
          {required.length === 0 ? (
            <p className="px-5 py-4 text-[12px] leading-relaxed text-muted-foreground">
              Nothing is required yet. When the same kind of mistake happens twice, the check that
              would have caught it becomes mandatory for every agent.
            </p>
          ) : (
            required.map((policy) => <PolicyRow key={policy.cls} policy={policy} />)
          )}
        </div>

        {watching.length > 0 ? (
          <details className="group mt-3 overflow-hidden rounded-[18px] border border-border bg-background">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-[12px] font-bold text-text2 hover:text-foreground">
              <span>
                Watching {watching.length} other {watching.length === 1 ? "check" : "checks"}
                <span className="ml-2 font-semibold text-muted-foreground">
                  — not required until a second mistake
                </span>
              </span>
              <span className="zk-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground group-open:hidden">
                show
              </span>
              <span className="zk-mono hidden text-[9px] uppercase tracking-[0.06em] text-muted-foreground group-open:inline">
                hide
              </span>
            </summary>
            <div className="border-t border-border bg-card">
              {watching.map((policy) => (
                <PolicyRow key={policy.cls} policy={policy} />
              ))}
            </div>
          </details>
        ) : null}
      </section>

      <section>
        <h2 className="text-[14px] font-bold text-foreground">The record</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Every check you ran and every risk you took, kept in order. You never have to rely on
          memory.
        </p>
        <ol className="mt-3 overflow-hidden rounded-[18px] border border-border bg-card shadow-card">
          {ledger.slice(0, 30).map((entry) => {
            const outcome = OUTCOME[entry.outcome];
            return (
              <li key={entry.id} className="border-t border-divider px-5 py-4 first:border-t-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="zk-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      {stampTime(entry.at)}
                    </span>
                    <span className="zk-mono text-[11px] font-medium text-text2">{entry.target}</span>
                    <span className="zk-mono rounded-full bg-chip px-2 py-0.5 text-[9px] uppercase tracking-[0.04em] text-text2">
                      {GAP_CLASS_PLAIN[entry.gapClass] ?? entry.gapClass}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.06em] ${outcome.className}`}
                  >
                    {outcome.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                  {entry.plain ?? entry.assumption}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-[20px] border border-ink-border bg-ink px-6 py-6 shadow-[0_24px_60px_rgba(11,23,51,0.18)]">
        <p className="zk-mono text-[9px] font-medium uppercase tracking-[0.14em] text-sky">
          Why the record matters
        </p>
        <p className="mt-2.5 max-w-2xl text-[16px] font-semibold leading-relaxed text-white">
          A risk you accept is a promise you made. A check that was wrong is a lesson. Keeping both
          means the next person does not have to remember — and the same mistake cannot quietly
          happen twice.
        </p>
      </section>
    </div>
  );
}

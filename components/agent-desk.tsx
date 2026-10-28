import { Check, Lock, Minus } from "lucide-react";
import { openGaps } from "@/hooks/use-review";
import {
  GAP_CLASS_LABEL,
  GAP_CLASS_PLAIN,
  policiesOf,
  timeAgo,
  type Handoff,
  type LedgerEntry,
} from "@/lib/model";

const REQUIREMENT: Record<string, string> = {
  "env-parity": "Proof that the live site is the same version it tested.",
  "repo-attribution": "The repo the issue belongs to, and proof it is the right one.",
  "duplicate-scan": "The search it ran, and how many matches came back.",
  reachability: "The route, and every permission check in front of it.",
  "data-shape": "The actual response data, not a description of it.",
  "consumer-impact": "Every place that calls the code, and how it is configured.",
};

const STATUS_TEXT: Record<Handoff["status"], string> = {
  awaiting: "waiting for a human",
  testing: "proof requested",
  revised: "claim withdrawn",
  approved: "approved",
  rejected: "sent back",
};

export function AgentDesk({
  handoffs,
  ledger,
}: {
  handoffs: Handoff[];
  ledger: LedgerEntry[];
}) {
  const policies = policiesOf(ledger);
  const mandatory = policies.filter((policy) => policy.mandatory);
  const active = handoffs.filter(
    (handoff) => handoff.status !== "approved" && handoff.status !== "rejected"
  );

  return (
    <div className="flex flex-col gap-7">
      <section className="overflow-hidden rounded-[20px] border border-ink-border bg-ink shadow-[0_24px_60px_rgba(11,23,51,0.2)]">
        <div className="flex items-center justify-between gap-3 border-b border-[rgba(38,59,99,0.65)] px-5 py-3.5">
          <h2 className="zk-mono text-[9px] font-medium uppercase tracking-[0.14em] text-sky">
            Required before asking you
          </h2>
          <span className="zk-mono rounded-full bg-[rgba(38,59,99,0.55)] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-text">
            {mandatory.length} active
          </span>
        </div>
        {mandatory.length === 0 ? (
          <p className="px-5 py-4 text-[13px] text-ink-text">
            No required checks yet. Agents still list their blind spots, but nothing is mandatory.
          </p>
        ) : (
          <ul>
            {mandatory.map((policy) => (
              <li
                key={policy.cls}
                className="flex flex-wrap items-start justify-between gap-3 border-t border-[rgba(38,59,99,0.65)] px-5 py-4 first:border-t-0"
              >
                <div className="flex min-w-0 gap-3">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-sky" aria-hidden="true" />
                  <div>
                    <p className="text-[13px] font-bold text-white">
                      {GAP_CLASS_PLAIN[policy.cls] ?? policy.cls}
                      <span className="zk-mono ml-2 text-[9px] font-medium uppercase tracking-[0.05em] text-[#8598bb]">
                        {GAP_CLASS_LABEL[policy.cls] ?? policy.cls}
                      </span>
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-text">
                      {REQUIREMENT[policy.cls] ?? "The evidence for this check."}
                    </p>
                  </div>
                </div>
                <span className="zk-mono rounded-full border border-ink-border bg-[rgba(38,59,99,0.55)] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-text">
                  {policy.incidents} mistakes
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-[14px] font-bold text-foreground">Are these requests ready?</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Green means the agent attached the proof. Red means the proof is still missing.
        </p>
        <div className="mt-3 overflow-hidden rounded-[18px] border border-border bg-card shadow-card">
          {active.length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-muted-foreground">Nothing waiting.</p>
          ) : (
            active.map((handoff) => {
              const checks = mandatory.map((policy) => {
                const attached = handoff.gaps.find(
                  (gap) => gap.cls === policy.cls && gap.state !== "open"
                );
                return { cls: policy.cls, attached: Boolean(attached) };
              });
              const missing = checks.filter((check) => !check.attached).length;
              return (
                <div key={handoff.id} className="border-t border-divider px-5 py-4 first:border-t-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="zk-mono text-[11px] font-medium text-foreground">
                        {handoff.target}
                      </span>
                      <span className="zk-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground">
                        {STATUS_TEXT[handoff.status]} · {timeAgo(handoff.createdAt)}
                      </span>
                    </div>
                    <span className="zk-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-text2">
                      {openGaps(handoff).length} open
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {checks.length === 0 ? (
                      <li className="zk-mono text-[9.5px] uppercase tracking-[0.06em] text-muted-foreground">
                        no required checks
                      </li>
                    ) : (
                      checks.map((check) => (
                        <li
                          key={check.cls}
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.04em] ${
                            check.attached ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad"
                          }`}
                        >
                          {check.attached ? (
                            <Check className="size-3" aria-hidden="true" />
                          ) : (
                            <Minus className="size-3" aria-hidden="true" />
                          )}
                          {GAP_CLASS_PLAIN[check.cls] ?? check.cls}
                        </li>
                      ))
                    )}
                  </ul>
                  {missing > 0 ? (
                    <p className="mt-2.5 text-[12px] leading-relaxed text-text2">
                      {missing} required {missing === 1 ? "check is" : "checks are"} still missing
                      proof, so this request cannot be approved cleanly yet.
                    </p>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            step: "01",
            title: "It lists its guesses",
            body:
              "The request includes everything the agent did not check, biggest risk first — instead of just claiming it is done.",
          },
          {
            step: "02",
            title: "It brings proof",
            body:
              "Once a check is required, saying “I tested it” is not enough. The result has to be attached to the request.",
          },
          {
            step: "03",
            title: "A wrong guess costs it the claim",
            body:
              "If a check proves the agent wrong, it has to withdraw and start again. It cannot argue its way past a failed test.",
          },
        ].map((item) => (
          <div key={item.step} className="rounded-[16px] border border-border bg-card p-5 shadow-card">
            <span className="flex size-9 items-center justify-center rounded-full bg-tint text-[11px] font-extrabold text-primary">
              {item.step}
            </span>
            <h3 className="zk-display mt-3 text-[15px] font-bold text-foreground">{item.title}</h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-text2">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

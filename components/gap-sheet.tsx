import { Check, ChevronDown, Clock, Lock, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canApprove, openGaps } from "@/hooks/use-review";
import {
  GAP_CLASS_PLAIN,
  isMandatory,
  policiesOf,
  regretBand,
  regretOf,
  riskWord,
  stampTime,
  timeAgo,
  type Gap,
  type Handoff,
  type LedgerEntry,
} from "@/lib/model";

const BAND_COLOR: Record<ReturnType<typeof regretBand>, string> = {
  low: "var(--zk-ok-fg)",
  moderate: "var(--zk-warn-fg)",
  elevated: "var(--zk-bad-fg)",
  severe: "var(--zk-bad-fg)",
};

const STATUS: Record<Handoff["status"], { label: string; className: string }> = {
  awaiting: { label: "Waiting for you", className: "bg-info-bg text-info" },
  testing: { label: "Check running", className: "bg-warn-bg text-warn" },
  revised: { label: "Claim was wrong", className: "bg-bad-bg text-bad" },
  approved: { label: "Approved", className: "bg-ok-bg text-ok" },
  rejected: { label: "Sent back", className: "bg-chip text-muted-foreground" },
};

const MARK: Record<Gap["state"], { text: string; className: string }> = {
  open: { text: "Not answered", className: "bg-chip text-muted-foreground" },
  verified: { text: "Checked", className: "bg-ok-bg text-ok" },
  falsified: { text: "Checked", className: "bg-bad-bg text-bad" },
  accepted: { text: "Risk accepted", className: "bg-warn-bg text-warn" },
};

function CommandDisclosure({ gap }: { gap: Gap }) {
  return (
    <details className="group mt-2.5 border-t border-black/10 pt-2 dark:border-white/10">
      <summary className="flex cursor-pointer list-none items-center gap-1 text-[11px] font-semibold text-text2 transition-colors hover:text-primary">
        <ChevronDown
          className="size-3 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
        What this check ran
      </summary>
      <code className="zk-mono mt-1.5 block overflow-x-auto whitespace-pre rounded-lg bg-white/70 px-3 py-2 text-[11px] leading-relaxed text-text2 dark:bg-white/10">
        {gap.test.command}
      </code>
    </details>
  );
}

function GapCard({
  gap,
  index,
  running,
  ledger,
  decided,
  onRun,
  onAccept,
}: {
  gap: Gap;
  index: number;
  running: boolean;
  ledger: LedgerEntry[];
  decided: boolean;
  onRun: () => void;
  onAccept: () => void;
}) {
  const mandatory = isMandatory(ledger, gap.cls);
  const incidents = policiesOf(ledger).find((policy) => policy.cls === gap.cls)?.incidents ?? 0;
  const open = gap.state === "open";
  const mark = MARK[gap.state];

  return (
    <article className="border-t border-divider px-5 py-5 first:border-t-0 sm:px-7">
      <div className="flex items-start gap-3">
        <span
          className={`zk-mono mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
            open ? "bg-tint text-primary" : "bg-chip text-text2"
          }`}
          aria-hidden="true"
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`zk-mono rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.06em] ${mark.className}`}
            >
              {mark.text}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: BAND_COLOR[regretBand(gap)] }}
                aria-hidden="true"
              />
              <span className="zk-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {riskWord(gap)} risk
              </span>
            </span>
            {mandatory ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-warn-line bg-warn-bg px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.06em] text-warn">
                <Lock className="size-2.5" aria-hidden="true" />
                Required now
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
            {gap.ask ?? gap.assumption}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-text2">If that is wrong: </span>
            {gap.why ?? gap.blast}
          </p>

          {gap.state === "open" ? (
            <div className="mt-3 rounded-[16px] border border-ink-border bg-ink p-3.5 shadow-[0_16px_40px_rgba(11,23,51,0.16)]">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="zk-mono flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-sky">
                    <Clock className="size-3" aria-hidden="true" />
                    Your check · about {Math.max(1, Math.round(gap.test.durationMs / 1000))}s
                  </p>
                  <p className="mt-1 text-[13px] font-semibold leading-snug text-white">
                    {gap.test.label}
                  </p>
                </div>
                {open && !decided ? (
                  <Button
                    onClick={onRun}
                    disabled={running}
                    className="h-9 shrink-0 gap-1.5 rounded-full bg-primary px-4 text-[12px] font-bold text-primary-foreground shadow-none hover:bg-accent-strong"
                  >
                    <Play className="size-3" aria-hidden="true" />
                    {running ? "Checking…" : "Run the check"}
                  </Button>
                ) : null}
              </div>

              <details className="group mt-2 border-t border-white/10 pt-2">
                <summary className="zk-mono flex cursor-pointer list-none items-center gap-1 text-[9px] uppercase tracking-[0.08em] text-[#8598bb] transition-colors hover:text-sky">
                  <ChevronDown
                    className="size-3 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                  What this check runs
                </summary>
                <code className="zk-mono mt-1.5 block overflow-x-auto whitespace-pre rounded-lg bg-ink-3 px-3 py-2 text-[11px] leading-relaxed text-[#d7e3f9]">
                  {gap.test.command}
                </code>
              </details>
            </div>
          ) : null}

          {gap.state === "verified" ? (
            <div className="result-pop mt-3 rounded-[14px] bg-ok-bg px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-ok">
                <Check className="size-3.5" aria-hidden="true" />
                It held up
              </p>
              <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-ok-ink">
                {gap.test.passPlain ?? gap.test.passOutput}
              </p>
              <CommandDisclosure gap={gap} />
            </div>
          ) : null}

          {gap.state === "falsified" ? (
            <div className="result-pop mt-3 rounded-[14px] bg-bad-bg px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-bad">
                <X className="size-3.5" aria-hidden="true" />
                It was wrong
              </p>
              <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-bad-ink">
                {gap.test.failPlain ?? gap.test.failOutput}
              </p>
              {mandatory ? (
                <p className="mt-2 border-t border-bad-line/70 pt-2 text-[12px] font-medium leading-relaxed text-bad">
                  This kind of check has now been wrong {incidents} times, so it is required before
                  any agent can ask you again.
                </p>
              ) : null}
              <CommandDisclosure gap={gap} />
            </div>
          ) : null}

          {gap.state === "accepted" ? (
            <div className="result-pop mt-3 rounded-[14px] bg-warn-bg px-3.5 py-3">
              <p className="text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-warn">
                You accepted this risk
              </p>
              <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-warn-ink">
                It is on the record. If this goes wrong, it counts against{" "}
                {GAP_CLASS_PLAIN[gap.cls] ?? gap.cls}.
              </p>
            </div>
          ) : null}

          {open && !decided ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onAccept}
                disabled={running || mandatory}
                title={
                  mandatory
                    ? `Required after ${incidents} mistakes. Run the check instead of skipping it.`
                    : "Take this risk knowingly and put it on the record."
                }
                className="h-8 rounded-full border border-border bg-card px-3 text-[11.5px] font-bold text-text2 transition-colors hover:border-warn-line hover:text-warn disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mandatory ? "Can't skip — required" : "Skip it, I'll take the risk"}
              </button>
              <span className="text-[11px] text-muted-foreground">
                {mandatory
                  ? "This one was wrong before, so it has to be checked."
                  : "Skipping is allowed, but it is written down."}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function GapSheet({
  handoff,
  ledger,
  running,
  onRunGap,
  onAcceptGap,
  onDecide,
  onBack,
}: {
  handoff: Handoff;
  ledger: LedgerEntry[];
  running: Record<string, boolean>;
  onRunGap: (handoffId: string, gapId: string) => void;
  onAcceptGap: (handoffId: string, gapId: string) => void;
  onDecide: (handoffId: string, verdict: "approved" | "rejected") => void;
  onBack: () => void;
}) {
  const gaps = [...handoff.gaps].sort((a, b) => regretOf(b) - regretOf(a));
  const open = openGaps(handoff);
  const verified = handoff.gaps.filter((gap) => gap.state === "verified").length;
  const wrong = handoff.gaps.filter((gap) => gap.state === "falsified").length;
  const answered = handoff.gaps.length - open.length;
  const status = STATUS[handoff.status];
  const decided = handoff.status === "approved" || handoff.status === "rejected";
  const needsRevision = handoff.status === "revised";

  return (
    <section className="rounded-[22px] border border-border bg-card shadow-card">
      <header className="px-5 pt-5 pb-4 sm:px-7 sm:pt-6">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-4">
          <p className="text-[11.5px] font-semibold leading-snug text-primary">
            {handoff.agent} {handoff.wants ?? `wants permission to ship ${handoff.target}`}
          </p>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.06em] ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <h1 className="zk-display mt-2 text-[23px] font-extrabold leading-[1.22] text-foreground sm:text-[27px]">
          {handoff.plainClaim ?? handoff.claim}
        </h1>

        <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted-foreground">
          <span className="zk-mono rounded-full bg-chip px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.04em] text-text2">
            {handoff.target}
          </span>
          <span>
            {handoff.repo} · asked {timeAgo(handoff.createdAt)}
          </span>
        </p>

        <details className="group mt-4 rounded-[14px] border border-divider bg-background px-3.5 py-2.5">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11.5px] font-bold text-text2 transition-colors hover:text-primary">
            <ChevronDown
              className="size-3 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
            Technical details
          </summary>
          <p className="mt-2 text-[12px] font-medium leading-relaxed text-text2">{handoff.claim}</p>
          <ul className="mt-2.5 grid gap-1.5">
            {handoff.evidence.map((item) => (
              <li key={item.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <span className="zk-mono shrink-0 text-[10.5px] font-medium text-text2">
                  {item.label}
                </span>
                <span className="text-[11.5px] leading-relaxed text-muted-foreground">
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </header>

      <div className="border-y border-divider bg-background px-5 py-3 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-bold text-foreground">
            {handoff.gaps.length} things it did not check
          </p>
          <p className="zk-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-text2">
            {answered} of {handoff.gaps.length} answered
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(answered / Math.max(1, handoff.gaps.length)) * 100}%` }}
          />
        </div>
        {!decided ? (
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
            Answer each one — run the check, or accept the risk. Approve unlocks when every item
            here has an answer.
          </p>
        ) : null}
      </div>

      <div>
        {gaps.map((gap, index) => (
          <GapCard
            key={gap.id}
            gap={gap}
            index={index}
            decided={decided}
            ledger={ledger}
            running={Boolean(running[gap.id]) || handoff.status === "testing"}
            onRun={() => onRunGap(handoff.id, gap.id)}
            onAccept={() => onAcceptGap(handoff.id, gap.id)}
          />
        ))}
      </div>

      <footer className="sticky bottom-0 z-10 rounded-b-[22px] border-t border-border bg-card/95 px-5 py-3.5 backdrop-blur-xl sm:px-7">
        {decided ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                className={`text-[12.5px] font-extrabold ${
                  handoff.status === "approved" ? "text-ok" : "text-bad"
                }`}
              >
                {handoff.status === "approved"
                  ? "Approved — this work can ship"
                  : "Sent back — nothing ships until it is fixed"}
              </p>
              <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
                {handoff.decision
                  ? `${stampTime(handoff.decision.at)} · ${handoff.decision.acceptedRisks} risk${
                      handoff.decision.acceptedRisks === 1 ? "" : "s"
                    } accepted · ${verified} check${verified === 1 ? "" : "s"} held up · ${wrong} wrong`
                  : "Decision recorded."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full border px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] ${
                  handoff.status === "approved"
                    ? "border-ok/25 bg-ok-bg text-ok"
                    : "border-bad-line bg-bad-bg text-bad"
                }`}
              >
                {handoff.status === "approved" ? "approved" : "sent back"}
              </span>
              <button
                type="button"
                onClick={onBack}
                className="h-9 rounded-full bg-primary px-4 text-[11.5px] font-bold text-primary-foreground transition-colors hover:bg-accent-strong"
              >
                See other requests
              </button>
            </div>
          </div>
        ) : needsRevision ? (
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-text2">
              <span className="font-bold text-bad">This claim is wrong. </span>
              A check proved it. The agent has to rewrite it and come back with proof.
            </p>
            <Button
              onClick={() => onDecide(handoff.id, "rejected")}
              className="h-10 w-full shrink-0 rounded-full bg-primary px-5 text-[12px] font-bold text-primary-foreground shadow-primary hover:bg-accent-strong sm:w-auto"
            >
              Send back for revision
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-foreground">
                {open.length === 0 ? "All answered — your call" : `${open.length} still unanswered`}
              </p>
              <p className="mt-0.5 hidden truncate text-[11px] text-muted-foreground sm:block">
                {open.length === 0
                  ? "Approving means you have seen every risk and are okay with it."
                  : "Approve unlocks when each item is checked or accepted."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDecide(handoff.id, "rejected")}
                className="h-10 flex-1 rounded-full border border-border bg-card px-4 text-[12px] font-bold text-text2 transition-colors hover:border-bad-line hover:text-bad sm:flex-none"
              >
                Send back
              </button>
              <Button
                onClick={() => onDecide(handoff.id, "approved")}
                disabled={!canApprove(handoff)}
                className="h-10 flex-1 rounded-full bg-primary px-5 text-[12px] font-bold text-primary-foreground shadow-primary hover:bg-accent-strong disabled:shadow-none sm:flex-none"
              >
                <Check className="size-3.5" aria-hidden="true" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </footer>
    </section>
  );
}

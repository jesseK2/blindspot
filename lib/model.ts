export type GapState = "open" | "verified" | "falsified" | "accepted";

export type HandoffStatus =
  | "awaiting"
  | "testing"
  | "revised"
  | "approved"
  | "rejected";

export type GapTest = {
  label: string;
  command: string;
  durationMs: number;
  willFail: boolean;
  passOutput: string;
  failOutput: string;
  passPlain?: string;
  failPlain?: string;
};

export type Gap = {
  id: string;
  cls: string;
  assumption: string;
  blast: string;
  impact: number;
  likelihood: number;
  test: GapTest;
  state: GapState;
  ask?: string;
  why?: string;
};

export type Evidence = {
  label: string;
  detail: string;
};

export type Handoff = {
  id: string;
  agent: string;
  role: string;
  target: string;
  repo: string;
  claim: string;
  plainClaim?: string;
  wants?: string;
  evidence: Evidence[];
  gaps: Gap[];
  status: HandoffStatus;
  createdAt: number;
  revision?: string;
  decision?: {
    verdict: "approved" | "rejected";
    at: number;
    acceptedRisks: number;
  };
};

export type LedgerOutcome = "verified" | "falsified" | "accepted-risk";

export type LedgerEntry = {
  id: string;
  at: number;
  handoffId: string;
  target: string;
  gapClass: string;
  assumption: string;
  plain?: string;
  outcome: LedgerOutcome;
};

export type ReviewState = {
  handoffs: Handoff[];
  ledger: LedgerEntry[];
  poolIndex: number;
};

export const GAP_CLASS_LABEL: Record<string, string> = {
  "env-parity": "Environment parity",
  "repo-attribution": "Repo attribution",
  "duplicate-scan": "Duplicate scan",
  reachability: "Route reachability",
  "data-shape": "Data shape",
  "consumer-impact": "Consumer impact",
};

// Plain-language names for people who do not work in this codebase.
export const GAP_CLASS_PLAIN: Record<string, string> = {
  "env-parity": "Wrong version tested",
  "repo-attribution": "Wrong repo",
  "duplicate-scan": "Maybe already reported",
  reachability: "Missed permission check",
  "data-shape": "Leak may be smaller",
  "consumer-impact": "Other tools may break",
};

export const GAP_CLASS_WHY: Record<string, string> = {
  "env-parity": "The agent checked code that is not the code currently live.",
  "repo-attribution": "The fix may be paid or merged in the wrong place.",
  "duplicate-scan": "Someone may already be fixing the same thing.",
  reachability: "A permission check may already exist further down.",
  "data-shape": "The leak may be smaller than the claim says.",
  "consumer-impact": "Something else may still rely on the old behaviour.",
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const pass = (text: string): Pick<GapTest, "willFail" | "passOutput" | "failOutput"> => ({
  willFail: false,
  passOutput: text,
  failOutput: "",
});

const fail = (text: string): Pick<GapTest, "willFail" | "passOutput" | "failOutput"> => ({
  willFail: true,
  passOutput: "",
  failOutput: text,
});

const gap = (
  input: Omit<Gap, "id" | "state"> & { id: string }
): Gap => ({ ...input, state: "open" });

export const regretOf = (g: Gap) => g.impact * g.likelihood;

export const regretBand = (g: Gap): "low" | "moderate" | "elevated" | "severe" => {
  const regret = regretOf(g);
  if (regret >= 16) return "severe";
  if (regret >= 10) return "elevated";
  if (regret >= 5) return "moderate";
  return "low";
};

export const RISK_WORD: Record<ReturnType<typeof regretBand>, string> = {
  low: "Low",
  moderate: "Medium",
  elevated: "High",
  severe: "Severe",
};

export const riskWord = (g: Gap) => RISK_WORD[regretBand(g)];

export const seedHandoffs = (now: number): Handoff[] => [
  {
    id: "h-1332",
    agent: "Agent",
    role: "contributor",
    target: "issue #1332",
    repo: "office-zedu-fe",
    claim:
      "Saved filters are dropped on refresh because the persist effect runs before hydration, and the write is overwritten by the first render.",
    plainClaim:
      "Saved filters wipe themselves every time the page refreshes. The agent says it found the cause and already has a fix ready.",
    wants: "wants permission to fix issue #1332",
    evidence: [
      {
        label: "src/app/(client)/[org]/home/agents/page.tsx:88",
        detail: "hydrate() runs before the usePersistedState subscription exists.",
      },
      {
        label: "console",
        detail: "filters:v2 is written, then immediately replaced with the default object.",
      },
    ],
    gaps: [
      gap({
        id: "g-1332-1",
        cls: "env-parity",
        assumption: "The build I reproduced on is the commit staging currently serves.",
        blast:
          "If staging is older, the bug may already be fixed. The report burns a reviewer pass and costs the reporter 150 points when refuted.",
        ask: "It is testing the same version of the site that is live today.",
        why: "If it is not, the bug may already be fixed and this work fixes code nobody is running.",
        impact: 3,
        likelihood: 4,
        test: {
          label: "Compare the live site with the code the agent tested",
          command: "curl -s https://office.groups.zedu.chat/_next/BUILD_ID",
          durationMs: 1500,
          ...fail(
            "deployed 25cd4ec · local HEAD 8b1f0a2 · staging is 61 commits behind"
          ),
          failPlain:
            "No. The live site is 61 updates behind the code the agent tested, so its fix proves nothing yet.",
        },
      }),
      gap({
        id: "g-1332-2",
        cls: "repo-attribution",
        assumption: "The issue's repo field resolves to office-zedu-fe before I claim it.",
        blast:
          "Solver and merger pay cannot be attributed, so the fix stalls after merge even if it is correct.",
        ask: "The work belongs to the right repo, so it will actually be paid for.",
        why: "If not, the fix merges but nobody gets credit, and it stalls.",
        impact: 5,
        likelihood: 2,
        test: {
          label: "Check which repo the issue belongs to",
          command: "ziki issues get 1332 --field repoUrl",
          durationMs: 900,
          ...pass("repoUrl = https://github.com/zedu-team-neo-mando/office-zedu-fe"),
          passPlain:
            "Yes. The issue belongs to office-zedu-fe, so the work will be credited there.",
        },
      }),
      gap({
        id: "g-1332-3",
        cls: "duplicate-scan",
        assumption: "No open issue already reports the filter reset.",
        blast: "A duplicate splits votes and doubles triage for the same defect.",
        ask: "Nobody else has already reported this same bug.",
        why: "If someone has, two people fix one problem and both efforts get split.",
        impact: 2,
        likelihood: 3,
        test: {
          label: "Search open issues for the same bug",
          command: "ziki issues search \"saved filters\" --status open",
          durationMs: 1100,
          ...pass("0 matches in the open queue"),
          passPlain: "No duplicates. Nobody else has reported this.",
        },
      }),
    ],
    status: "awaiting",
    createdAt: now - 9 * MINUTE,
  },
  {
    id: "h-1320",
    agent: "Agent Reviewer",
    role: "reviewer",
    target: "validation · issue #1320",
    repo: "zedu-be",
    claim:
      "Accept at high severity: GET /organisations/:org_id/settings/agents/:agent_id is guarded by Authorize only, so any signed-in user can read another organisation's agent settings.",
    plainClaim:
      "Any signed-in user can read another organisation's private agent settings. The reviewer says this is a severe security hole.",
    wants: "wants you to accept issue #1320 as a high-severity finding",
    evidence: [
      {
        label: "pkg/router/agents.go:86",
        detail: "Route is registered on the organisationUrl group.",
      },
      {
        label: "pkg/middleware/authorize.go",
        detail: "Membership check is commented out; only the token is verified.",
      },
      {
        label: "services/agents/agentSettings.go:33",
        detail: "Lookup is by org_id and integration_id; no caller check.",
      },
    ],
    gaps: [
      gap({
        id: "g-1320-1",
        cls: "env-parity",
        assumption: "The staging build contains the router group I am citing.",
        blast:
          "Validating a code path that is not deployed overstates severity and misleads the reporter.",
        ask: "The code being blamed is actually running in staging.",
        why: "If it is not deployed yet, the report overstates how serious this is.",
        impact: 5,
        likelihood: 3,
        test: {
          label: "Check whether staging runs the code being cited",
          command: "git -C zedu-be show 25cd4ec -- pkg/router/agents.go",
          durationMs: 1600,
          ...fail(
            "staging is 25cd4ec · the route group was added in 3f9a2b1 (not deployed)"
          ),
          failPlain:
            "No. The exact route the reviewer cites is not deployed yet, so the severity is unproven.",
        },
      }),
      gap({
        id: "g-1320-2",
        cls: "reachability",
        assumption: "No membership check runs before this handler.",
        blast:
          "If a check exists elsewhere in the chain, the finding is wrong and the severity is inflated.",
        ask: "There is really no permission check before the data is returned.",
        why: "If a check exists somewhere else, the finding is wrong.",
        impact: 5,
        likelihood: 2,
        test: {
          label: "Trace the permissions on that endpoint",
          command: "grep -n \"organisationUrl\" -A6 pkg/router/router.go",
          durationMs: 1200,
          ...pass("group mounts Authorize only; no CheckUserIsMemberOfOrg"),
          passPlain:
            "Confirmed. The endpoint checks that you are signed in, but never checks which organisation you belong to.",
        },
      }),
      gap({
        id: "g-1320-3",
        cls: "data-shape",
        assumption: "The unauthorised response returns settings data, not only metadata.",
        blast:
          "If only metadata leaks, the finding should be medium, not high.",
        ask: "The response really contains private settings, not just harmless labels.",
        why: "If only labels leak, this is a medium issue, not a high one.",
        impact: 3,
        likelihood: 3,
        test: {
          label: "Look at what the response actually returns",
          command: "curl -s /organisations/org_b/settings/agents/agent_1 -H \"token: org_a\"",
          durationMs: 1400,
          ...pass("200 · {integration_id, agent_name, settings, invoice_pdf_url}"),
          passPlain:
            "Confirmed. It returns real settings and invoice links, not just labels.",
        },
      }),
    ],
    status: "awaiting",
    createdAt: now - 34 * MINUTE,
  },
  {
    id: "h-pr60",
    agent: "Agent",
    role: "contributor",
    target: "pull request #60",
    repo: "office-zedu-fe",
    claim:
      "Safe to merge: telemetry helpers skip requests when their base URL is unset, and configured deployments keep the same request shape.",
    plainClaim:
      "This analytics change should be safe to merge. The agent says nothing that is configured today will break.",
    wants: "wants permission to merge pull request #60",
    evidence: [
      {
        label: "src/utils/webhook-request.ts:16",
        detail: "buildWebhookUrl returns null for missing or literal \"undefined\" bases.",
      },
      {
        label: "src/app/layout.tsx:81",
        detail: "GTM scripts render only when both URL and measurement ID exist.",
      },
    ],
    gaps: [
      gap({
        id: "g-pr60-1",
        cls: "consumer-impact",
        assumption: "No deployment relies on a relative webhook URL that the old code resolved.",
        blast:
          "A same-origin relative endpoint would silently stop receiving events after the change.",
        ask: "Nothing today depends on the old webhook URL format.",
        why: "If something does, analytics silently stop arriving after the merge.",
        impact: 3,
        likelihood: 2,
        test: {
          label: "Look for deployments using the old URL format",
          command: "grep -rn \"NEXT_PUBLIC_.*WEBHOOK_URL\" deploy/",
          durationMs: 1300,
          ...pass("all values absolute or unset; no relative paths"),
          passPlain:
            "Clear. Every configured URL is absolute, so nothing relied on the old format.",
        },
      }),
      gap({
        id: "g-pr60-2",
        cls: "env-parity",
        assumption: "Staging has every telemetry variable unset, which is the changed path.",
        blast:
          "If variables are set there, the new skip branch is untested in the deployed shape.",
        ask: "Staging actually uses the new code path, not the old settings.",
        why: "If staging has the settings on, the new branch has never really run.",
        impact: 2,
        likelihood: 2,
        test: {
          label: "Check whether staging actually takes the new path",
          command: "grep -o \"undefined?event_name\" .next/static/chunks/*.js",
          durationMs: 1200,
          ...pass("no matches in the current bundle"),
          passPlain: "Clear. Staging runs the same new path the agent tested.",
        },
      }),
    ],
    status: "awaiting",
    createdAt: now - 2 * HOUR,
  },
];

export const createSeedState = (): ReviewState => {
  const now = Date.now();
  return {
    handoffs: seedHandoffs(now),
    poolIndex: 0,
    ledger: [
      {
        id: "l-1",
        at: now - 4 * DAY,
        handoffId: "h-old-1",
        target: "issue #1309",
        gapClass: "repo-attribution",
        assumption: "The issue's repo field points at the frontend.",
        plain: "This work belongs to the frontend repo.",
        outcome: "falsified",
      },
      {
        id: "l-2",
        at: now - 3 * DAY,
        handoffId: "h-old-2",
        target: "issue #1314",
        gapClass: "repo-attribution",
        assumption: "Solver pay will land on this repo after merge.",
        plain: "The solver gets paid in this repo after merge.",
        outcome: "falsified",
      },
      {
        id: "l-3",
        at: now - 2 * DAY,
        handoffId: "h-old-3",
        target: "validation · issue #1322",
        gapClass: "env-parity",
        assumption: "The cited route exists in the deployed build.",
        plain: "The page the report is about is actually live.",
        outcome: "falsified",
      },
      {
        id: "l-4",
        at: now - 1 * DAY,
        handoffId: "h-old-4",
        target: "issue #1327",
        gapClass: "duplicate-scan",
        assumption: "No open issue covers the same crash.",
        plain: "Nobody else has reported this crash.",
        outcome: "accepted-risk",
      },
      {
        id: "l-5",
        at: now - 7 * HOUR,
        handoffId: "h-old-5",
        target: "issue #1329",
        gapClass: "consumer-impact",
        assumption: "No other caller uses the helper.",
        plain: "No other feature depends on this helper.",
        outcome: "verified",
      },
    ],
  };
};

export const poolHandoffs = (now: number): Handoff[] => [
  {
    id: `h-${now}-a`,
    agent: "Agent",
    role: "contributor",
    target: "issue #1341",
    repo: "office-zedu-fe",
    claim:
      "The pricing page 404s under the /mainapp asset prefix because the build emits absolute /_next URLs.",
    plainClaim:
      "The pricing page breaks when it loads its files from the wrong path. The agent says a build setting is the cause.",
    wants: "wants permission to fix issue #1341",
    evidence: [
      {
        label: "next.config.mjs:24",
        detail: "assetPrefix is set, but images.useRelativeSrc is not.",
      },
      { label: "deployed HTML", detail: "script src=\"/_next/static/...\" resolves to the root host." },
    ],
    gaps: [
      gap({
        id: `g-${now}-a1`,
        cls: "repo-attribution",
        assumption: "The issue's repo field resolves to office-zedu-fe.",
        blast: "Pay cannot be attributed; the fix stalls after merge.",
        ask: "The work belongs to the right repo, so it will actually be paid for.",
        why: "If not, the fix merges but nobody gets credit, and it stalls.",
        impact: 5,
        likelihood: 2,
        test: {
          label: "Check which repo the issue belongs to",
          command: "ziki issues get 1341 --field repoUrl",
          durationMs: 900,
          ...pass("repoUrl = https://github.com/zedu-team-neo-mando/office-zedu-fe"),
          passPlain:
            "Yes. The issue belongs to office-zedu-fe, so the work will be credited there.",
        },
      }),
      gap({
        id: `g-${now}-a2`,
        cls: "consumer-impact",
        assumption: "No reverse proxy rewrites /_next to /mainapp/_next.",
        blast: "If a rewrite exists, the 404 is not caused by the build config.",
        ask: "Nothing else already fixes those file paths.",
        why: "If a proxy already rewrites them, the build setting is not the cause.",
        impact: 4,
        likelihood: 4,
        test: {
          label: "Check for a proxy that already fixes the paths",
          command: "curl -sI https://office.groups.zedu.chat/_next/static/chunks/main.js",
          durationMs: 1400,
          ...fail("HTTP 404 · no rewrite · the config is the likely cause"),
          failPlain:
            "No proxy. The bad path really is served from the root, so the build setting is the likely cause.",
        },
      }),
      gap({
        id: `g-${now}-a3`,
        cls: "duplicate-scan",
        assumption: "No open issue covers the same prefix bug.",
        blast: "Duplicate triage.",
        ask: "Nobody else has already reported this same bug.",
        why: "If someone has, two people fix one problem and both efforts get split.",
        impact: 2,
        likelihood: 3,
        test: {
          label: "Search open issues for the same bug",
          command: "ziki issues search \"mainapp asset prefix\" --status open",
          durationMs: 1100,
          ...pass("0 matches"),
          passPlain: "No duplicates. Nobody else has reported this.",
        },
      }),
    ],
    status: "awaiting",
    createdAt: now,
  },
  {
    id: `h-${now}-b`,
    agent: "Agent Reviewer",
    role: "reviewer",
    target: "validation · issue #1336",
    repo: "office-zedu-fe",
    claim:
      "Accept as medium: the offer-hold flow never expires, so a stale hold keeps points locked.",
    plainClaim:
      "Points stay locked forever when an offer is never released. The reviewer says this is a medium issue.",
    wants: "wants you to accept issue #1336 as a medium-severity finding",
    evidence: [
      { label: "services/offers/holds.go:72", detail: "Release path only runs on explicit cancel." },
    ],
    gaps: [
      gap({
        id: `g-${now}-b1`,
        cls: "env-parity",
        assumption: "The offer service running on staging includes the release path I read.",
        blast: "Validating behavior that is not deployed inflates severity.",
        ask: "The offers service is running the exact code being blamed.",
        why: "If staging is older, the behaviour being described may not be live.",
        impact: 5,
        likelihood: 3,
        test: {
          label: "Check whether staging runs the cited code",
          command: "ziki validations env --service offers",
          durationMs: 1200,
          ...fail("staging offers service is 2 releases behind the cited file"),
          failPlain:
            "No. The offers service on staging is two releases behind the code being cited.",
        },
      }),
      gap({
        id: `g-${now}-b2`,
        cls: "repo-attribution",
        assumption: "The issue belongs to this repo.",
        blast: "Payout attribution fails.",
        ask: "The issue is linked to a repo, so payment can happen.",
        why: "If it is not linked, the payout is blocked even after a correct fix.",
        impact: 5,
        likelihood: 2,
        test: {
          label: "Check which repo the issue belongs to",
          command: "ziki issues get 1336 --field repoUrl",
          durationMs: 900,
          ...fail("repoUrl = null · payout blocked"),
          failPlain:
            "No. The issue has no repo attached, so payment would be blocked even after a correct fix.",
        },
      }),
    ],
    status: "awaiting",
    createdAt: now,
  },
];

export type Policy = {
  cls: string;
  incidents: number;
  mandatory: boolean;
};

export const MANDATORY_THRESHOLD = 2;

export const policiesOf = (ledger: LedgerEntry[]): Policy[] => {
  const counts = new Map<string, number>();
  ledger
    .filter((entry) => entry.outcome === "falsified")
    .forEach((entry) => {
      counts.set(entry.gapClass, (counts.get(entry.gapClass) ?? 0) + 1);
    });
  return Object.keys(GAP_CLASS_LABEL)
    .map((cls) => {
      const incidents = counts.get(cls) ?? 0;
      return { cls, incidents, mandatory: incidents >= MANDATORY_THRESHOLD };
    })
    .sort((a, b) => b.incidents - a.incidents);
};

export const isMandatory = (ledger: LedgerEntry[], cls: string) =>
  policiesOf(ledger).some((policy) => policy.cls === cls && policy.mandatory);

export const timeAgo = (at: number): string => {
  const diff = Date.now() - at;
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  return `${Math.floor(diff / DAY)}d ago`;
};

export const stampTime = (at: number): string => {
  const date = new Date(at);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ── Types ─────────────────────────────────────────────────────────────────────
export type Status = "ACTIVE" | "ELIMINATED" | "IN EXILE" | "UNKNOWN";
export type Threat = "critical" | "high" | "moderate" | "low";
export type CapturePriority =
  | "CAPTURE ALIVE"
  | "ELIMINATE ON SIGHT"
  | "OBSERVE & REPORT";
export type LogClass = "OPEN" | "RESTRICTED" | "CLASSIFIED";

export interface Affiliation {
  name: string;
  role: string;
}
export interface Sighting {
  date: string;
  sector: string;
  description: string;
}
export interface ActivityEntry {
  date: string;
  event: string;
  classification: LogClass;
}
export interface ThreatBreakdown {
  forceSensitivity: number;
  combat: number;
  recruitmentRisk: number;
  evasion: number;
}
export interface Dossier {
  id: string;
  codename: string;
  realName: string;
  species: string;
  sector: string;
  status: Status;
  threat: Threat;
  midiChlorians: number;
  inquisitorAssigned: string;
  affiliations: Affiliation[];
  lastSighting: Sighting;
  knownAbilities: string[];
  bounty: string;
  notes: string;
  // ── New fields ───────────────────────────────────────────────────────────────
  lightsaberColor: string;
  lightsaberLabel: string;
  capturePriority: CapturePriority;
  hcetRole: string;
  activityLog: ActivityEntry[];
  threatBreakdown: ThreatBreakdown;
}

// ── Color maps ────────────────────────────────────────────────────────────────
export const STATUS_COLOR: Record<Status, string> = {
  ACTIVE: "#dc2626",
  ELIMINATED: "#22c55e",
  "IN EXILE": "#f59e0b",
  UNKNOWN: "#64748b",
};
export const THREAT_COLOR: Record<Threat, string> = {
  critical: "#dc2626",
  high: "#f59e0b",
  moderate: "#3b82f6",
  low: "#22c55e",
};
export const THREAT_LABEL: Record<Threat, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  moderate: "MODERATE",
  low: "LOW",
};
export const CAPTURE_COLOR: Record<CapturePriority, string> = {
  "CAPTURE ALIVE": "#f59e0b",
  "ELIMINATE ON SIGHT": "#dc2626",
  "OBSERVE & REPORT": "#3b82f6",
};
export const LOG_COLOR: Record<LogClass, string> = {
  OPEN: "#374151",
  RESTRICTED: "#f59e0b",
  CLASSIFIED: "#dc2626",
};

// ── Data ──────────────────────────────────────────────────────────────────────
export const DOSSIERS: Dossier[] = [
  {
    id: "KEN-001",
    codename: "KENOBI-ECHO",
    realName: "Obi-Wan Kenobi",
    species: "Human",
    sector: "TATOOINE · OUTER RIM",
    status: "IN EXILE",
    threat: "critical",
    midiChlorians: 13400,
    inquisitorAssigned: "Second Sister",
    affiliations: [
      { name: "Jedi High Council", role: "Master" },
      { name: "HCET Syndicate", role: "Senior Coordinator" },
    ],
    lastSighting: {
      date: "19 BBY · CYCLE 7",
      sector: "Polis Massa",
      description:
        "Intercepted encrypted HoloNet burst from desert coordinates. Likely sheltering near moisture farm settlements. Consider activating local informant network.",
    },
    knownAbilities: ["Soresu (Form III)", "Mind Trick", "Force Leap", "Battle Meditation"],
    bounty: "50,000 IMPERIAL CREDITS",
    notes:
      "Extremely dangerous. Do not engage without Inquisitor escort. Former member of Jedi High Council. Trained Anakin Skywalker. Considered architect of HCET comm protocols.",
    lightsaberColor: "#3b82f6",
    lightsaberLabel: "BLUE · SINGLE BLADE",
    capturePriority: "CAPTURE ALIVE",
    hcetRole: "Senior Coordinator — Comm Protocol Architect",
    activityLog: [
      { date: "19 BBY · C7", event: "Encrypted HoloNet burst detected — Tatooine Grid 7-Alpha", classification: "CLASSIFIED" },
      { date: "19 BBY · C4", event: "Identified aboard Tantive IV docking bay — Polis Massa", classification: "RESTRICTED" },
      { date: "19 BBY · C1", event: "Last confirmed sighting: Republic Senate — Coruscant", classification: "OPEN" },
      { date: "18 BBY · C22", event: "Signal intercept — HCET Syndicate frequency spike", classification: "CLASSIFIED" },
      { date: "18 BBY · C15", event: "Informant report: moisture farm region, Tatooine", classification: "RESTRICTED" },
    ],
    threatBreakdown: { forceSensitivity: 85, combat: 92, recruitmentRisk: 70, evasion: 88 },
  },
  {
    id: "YOD-002",
    codename: "SHADOW-PRIME",
    realName: "Yoda",
    species: "Unknown",
    sector: "DAGOBAH · OUTER RIM",
    status: "IN EXILE",
    threat: "critical",
    midiChlorians: 17700,
    inquisitorAssigned: "Grand Inquisitor",
    affiliations: [
      { name: "Jedi High Council", role: "Grand Master" },
      { name: "HCET Syndicate", role: "Founder" },
    ],
    lastSighting: {
      date: "19 BBY · CYCLE 12",
      sector: "Dagobah System",
      description:
        "Faint Force signature detected in Dagobah swamp region. Dense atmospheric interference prevents orbital scans. Ground deployment required.",
    },
    knownAbilities: ["Ataru (Form IV)", "Force Sense", "Telekinesis", "Force Barrier"],
    bounty: "CLASSIFIED — EMPEROR-LEVEL PRIORITY",
    notes:
      "Highest priority target. Approach only under direct Imperial authorization. Age and species may affect physical mobility but Force capability remains unmatched. HCET Syndicate spiritual leader.",
    lightsaberColor: "#22c55e",
    lightsaberLabel: "GREEN · SINGLE BLADE",
    capturePriority: "CAPTURE ALIVE",
    hcetRole: "Founder & Spiritual Leader",
    activityLog: [
      { date: "19 BBY · C12", event: "Force signature detected — Dagobah atmospheric anomaly", classification: "CLASSIFIED" },
      { date: "19 BBY · C8", event: "Escaped Imperial pursuit — Senate building, Coruscant", classification: "CLASSIFIED" },
      { date: "19 BBY · C6", event: "Confirmed conflict with Emperor — Coruscant Senate chamber", classification: "CLASSIFIED" },
      { date: "18 BBY · C30", event: "Long-range sensor array ping — Dagobah system", classification: "RESTRICTED" },
      { date: "18 BBY · C18", event: "HCET Syndicate founding broadcast — encrypted channel", classification: "CLASSIFIED" },
    ],
    threatBreakdown: { forceSensitivity: 99, combat: 95, recruitmentRisk: 60, evasion: 75 },
  },
  {
    id: "KAL-003",
    codename: "SURVIVOR-7",
    realName: "Kanan Jarrus",
    species: "Human",
    sector: "WILD SPACE",
    status: "ACTIVE",
    threat: "high",
    midiChlorians: 11200,
    inquisitorAssigned: "Fifth Brother",
    affiliations: [
      { name: "HCET Syndicate", role: "Field Operative" },
      { name: "Ghost Crew", role: "Leader" },
    ],
    lastSighting: {
      date: "19 BBY · CYCLE 22",
      sector: "Lothal Sector",
      description:
        "Confirmed sighting aboard Ghost-class freighter. Traveling with suspected Force-sensitive child. Mobile — no fixed base identified.",
    },
    knownAbilities: ["Djem So (Form V)", "Force Push", "Blaster Deflection"],
    bounty: "12,000 IMPERIAL CREDITS",
    notes:
      "Survived Order 66 as a Padawan. Partially trained — gaps in technique may be exploitable. Primary concern is the Force-sensitive child accompanying him.",
    lightsaberColor: "#3b82f6",
    lightsaberLabel: "BLUE · SINGLE BLADE",
    capturePriority: "ELIMINATE ON SIGHT",
    hcetRole: "Field Operative — Frontline Strike Teams",
    activityLog: [
      { date: "19 BBY · C22", event: "Ghost-class freighter sighted — Lothal orbit", classification: "OPEN" },
      { date: "19 BBY · C18", event: "Ambush on Imperial supply convoy — Lothal", classification: "RESTRICTED" },
      { date: "19 BBY · C14", event: "Identified acquiring lightsaber components — black market", classification: "OPEN" },
      { date: "18 BBY · C9", event: "Contact with Ezra Bridger confirmed — Force-sensitive child", classification: "RESTRICTED" },
      { date: "18 BBY · C3", event: "HCET frequency contact — Field Operative check-in", classification: "CLASSIFIED" },
    ],
    threatBreakdown: { forceSensitivity: 72, combat: 78, recruitmentRisk: 65, evasion: 70 },
  },
  {
    id: "AHK-004",
    codename: "FULCRUM-ALPHA",
    realName: "Ahsoka Tano",
    species: "Togruta",
    sector: "MID RIM",
    status: "ACTIVE",
    threat: "high",
    midiChlorians: 14200,
    inquisitorAssigned: "Seventh Sister",
    affiliations: [
      { name: "HCET Syndicate", role: "Intelligence Chief" },
      { name: "Rebel Network", role: "Handler" },
    ],
    lastSighting: {
      date: "19 BBY · CYCLE 19",
      sector: "Raada · Mid Rim",
      description:
        "Left Jedi Order prior to Order 66. Still maintains full Force capabilities. Uses alias FULCRUM for rebel communication network coordination.",
    },
    knownAbilities: ["Djem So", "Jar'Kai (Dual Wield)", "Force Sight", "Precognition"],
    bounty: "15,000 IMPERIAL CREDITS",
    notes:
      "Dangerous intelligence asset. Responsible for recruiting multiple rebel cells. Dual white-bladed lightsabers noted. High-priority capture preferred — intelligence extraction value is significant.",
    lightsaberColor: "#e2e8f0",
    lightsaberLabel: "WHITE · DUAL BLADE",
    capturePriority: "CAPTURE ALIVE",
    hcetRole: "Intelligence Chief — Network Handler (FULCRUM)",
    activityLog: [
      { date: "19 BBY · C19", event: "Alias FULCRUM identified — rebel comm intercept", classification: "CLASSIFIED" },
      { date: "19 BBY · C15", event: "Confirmed active on Raada, Mid Rim", classification: "OPEN" },
      { date: "19 BBY · C10", event: "Recruited two rebel cells — Lothal sector contacts", classification: "CLASSIFIED" },
      { date: "18 BBY · C28", event: "FULCRUM broadcast: coordinates passed to rebel handlers", classification: "CLASSIFIED" },
      { date: "18 BBY · C12", event: "Sighting near Alderaan — meeting with Bail Organa suspected", classification: "RESTRICTED" },
    ],
    threatBreakdown: { forceSensitivity: 88, combat: 90, recruitmentRisk: 92, evasion: 85 },
  },
  {
    id: "MKS-005",
    codename: "EXILE-EMBER",
    realName: "Quinlan Vos",
    species: "Kiffar",
    sector: "OUTER RIM",
    status: "UNKNOWN",
    threat: "moderate",
    midiChlorians: 12800,
    inquisitorAssigned: "Unassigned",
    affiliations: [{ name: "Jedi Order", role: "Master — Espionage Division" }],
    lastSighting: {
      date: "18 BBY · CYCLE 4",
      sector: "Unknown — last ping: Nar Shaddaa",
      description:
        "Signal lost after Nar Shaddaa underworld contact. Psychometric ability makes him exceptional at disappearing. May be operating undercover in criminal networks.",
    },
    knownAbilities: ["Psychometry", "Niman (Form VI)", "Undercover Operations", "Force Camouflage"],
    bounty: "8,000 IMPERIAL CREDITS",
    notes:
      "Specialist in disappearing. Former Jedi undercover operative. His psychometric ability — reading Force impressions from objects — means secure facilities may be compromised if he enters.",
    lightsaberColor: "#f59e0b",
    lightsaberLabel: "YELLOW · SINGLE BLADE",
    capturePriority: "OBSERVE & REPORT",
    hcetRole: "Ghost Operative — Infiltration & Espionage",
    activityLog: [
      { date: "18 BBY · C4", event: "Signal lost — Nar Shaddaa underworld district", classification: "RESTRICTED" },
      { date: "18 BBY · C1", event: "Identified by informant — Nar Shaddaa cantina", classification: "OPEN" },
      { date: "17 BBY · C40", event: "Psychometric artifact theft suspected — ISB vault compromise", classification: "CLASSIFIED" },
      { date: "17 BBY · C28", event: "Possible sighting — Hutt space, Nar Kanji", classification: "RESTRICTED" },
      { date: "17 BBY · C15", event: "No confirmed contact — file status: DORMANT", classification: "OPEN" },
    ],
    threatBreakdown: { forceSensitivity: 80, combat: 75, recruitmentRisk: 40, evasion: 96 },
  },
  {
    id: "CDR-006",
    codename: "GHOST-SIGNAL",
    realName: "Caleb Dume",
    species: "Human",
    sector: "LOTHAL · MID RIM",
    status: "ACTIVE",
    threat: "moderate",
    midiChlorians: 10600,
    inquisitorAssigned: "Ninth Sister",
    affiliations: [{ name: "HCET Syndicate", role: "New Recruit Coordinator" }],
    lastSighting: {
      date: "19 BBY · CYCLE 24",
      sector: "Lothal",
      description:
        "Young. Survived Order 66 by abandoning his identity. Now actively recruiting Force-sensitives for HCET Syndicate. Priority: disrupt recruitment pipeline.",
    },
    knownAbilities: ["Shii-Cho (Form I)", "Force Jump", "Animal Bond"],
    bounty: "5,000 IMPERIAL CREDITS",
    notes:
      "Young target, relatively untrained. High value for disrupting HCET Syndicate recruitment operations. Consider alive capture for conversion program.",
    lightsaberColor: "#3b82f6",
    lightsaberLabel: "BLUE · SINGLE BLADE",
    capturePriority: "CAPTURE ALIVE",
    hcetRole: "New Recruit Coordinator — Jedi Outreach",
    activityLog: [
      { date: "19 BBY · C24", event: "Spotted near Lothal settlement — recruiting Force-sensitives", classification: "OPEN" },
      { date: "19 BBY · C20", event: "Attempted capture — escaped Fifth Brother patrol", classification: "RESTRICTED" },
      { date: "19 BBY · C16", event: "Identity change confirmed — operating as 'Kanan Jarrus'", classification: "RESTRICTED" },
      { date: "18 BBY · C8", event: "Recruited Ezra Bridger — confirmed Force-sensitive child", classification: "CLASSIFIED" },
      { date: "18 BBY · C2", event: "HCET coordination signal — new recruit registration", classification: "CLASSIFIED" },
    ],
    threatBreakdown: { forceSensitivity: 68, combat: 62, recruitmentRisk: 82, evasion: 60 },
  },
  {
    id: "SEN-007",
    codename: "CRIMSON-VEIL",
    realName: "Luminara Unduli",
    species: "Mirialan",
    sector: "STYGEON PRIME · INNER RIM",
    status: "ELIMINATED",
    threat: "low",
    midiChlorians: 10500,
    inquisitorAssigned: "Grand Inquisitor",
    affiliations: [{ name: "Jedi High Council", role: "Master" }],
    lastSighting: {
      date: "19 BBY · CYCLE 1",
      sector: "Stygeon Prime — Spire Prison",
      description:
        "Confirmed eliminated in Spire Prison. Inquisitor bait operation successful — multiple rebel contacts neutralized attempting rescue.",
    },
    knownAbilities: ["Niman (Form VI)", "Force Healing", "Meditation Trance"],
    bounty: "CLOSED — ELIMINATED",
    notes:
      "Target eliminated. File maintained for rebel network mapping. Death used successfully as bait to identify rebel sympathizers. Operation: SUCCESS.",
    lightsaberColor: "#22c55e",
    lightsaberLabel: "GREEN · SINGLE BLADE",
    capturePriority: "ELIMINATE ON SIGHT",
    hcetRole: "Deceased — Former Jedi Council Liaison",
    activityLog: [
      { date: "19 BBY · C1", event: "TARGET ELIMINATED — Spire Prison, Stygeon Prime", classification: "OPEN" },
      { date: "19 BBY · C1", event: "Bait op: 3 rebel contacts captured attempting rescue", classification: "CLASSIFIED" },
      { date: "18 BBY · C45", event: "Transferred to Spire Prison — Grand Inquisitor custody", classification: "RESTRICTED" },
      { date: "19 BBY · C3", event: "Captured during Order 66 crackdown — Kashyyyk", classification: "OPEN" },
    ],
    threatBreakdown: { forceSensitivity: 65, combat: 66, recruitmentRisk: 30, evasion: 45 },
  },
  {
    id: "ZEB-008",
    codename: "UNKNOWN-OMEGA",
    realName: "[REDACTED]",
    species: "Unknown — Force-sensitive",
    sector: "WILD SPACE",
    status: "UNKNOWN",
    threat: "low",
    midiChlorians: 9200,
    inquisitorAssigned: "Unassigned",
    affiliations: [],
    lastSighting: {
      date: "19 BBY · CYCLE 30",
      sector: "Wild Space — uncharted region",
      description:
        "Faint Force signature detected by long-range sensor array. No visual confirmation. Source may be untrained. Monitoring recommended.",
    },
    knownAbilities: ["Unknown — untrained suspected"],
    bounty: "2,000 IMPERIAL CREDITS",
    notes:
      "Low priority. Likely untrained Force-sensitive. Risk: HCET Syndicate recruitment. Monitor and intercept if contact with known HCET operatives is detected.",
    lightsaberColor: "#64748b",
    lightsaberLabel: "UNKNOWN",
    capturePriority: "OBSERVE & REPORT",
    hcetRole: "Unaffiliated — Active Recruitment Target",
    activityLog: [
      { date: "19 BBY · C30", event: "Force signature detected — long-range array, Wild Space", classification: "RESTRICTED" },
      { date: "19 BBY · C28", event: "No visual confirmation — monitoring continues", classification: "OPEN" },
      { date: "18 BBY · C12", event: "Second sensor anomaly — same uncharted region", classification: "RESTRICTED" },
    ],
    threatBreakdown: { forceSensitivity: 58, combat: 20, recruitmentRisk: 15, evasion: 55 },
  },
];

export function getDossier(id: string): Dossier | undefined {
  return DOSSIERS.find((d) => d.id === id);
}

export const ALL_STATUSES: Status[] = ["ACTIVE", "ELIMINATED", "IN EXILE", "UNKNOWN"];

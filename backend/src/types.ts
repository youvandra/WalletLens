export interface OkLinkTransaction {
  txId: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  txFee: string;
  blockHeight: number;
  timestamp: number;
  methodId?: string;
  status: "success" | "fail";
}

export interface ActivityBreakdown {
  swap: number;
  approve: number;
  transfer: number;
  native: number;
  other: number;
}

// Decision-grade behavioral flags an agent can act on. All heuristic and
// derived only from analyzed on-chain activity.
export interface WalletSignals {
  nightOwl: boolean;
  approvalHeavy: boolean;
  likelyBot: boolean;
  dustPattern: boolean;
  highSwapActivity: boolean;
  newWallet: boolean;
  dormant: boolean;
  whale: boolean;
}

// What the analysis was based on, so an agent can weigh how much to trust it.
export interface AnalysisEvidence {
  analyzedTx: number;
  totalTx: number;
  window: string;
  caveat: string;
}

export interface WalletMetrics {
  totalTx: number;
  tokenSymbol: string;
  balanceEth: string;
  balanceUsd: string;
  gasBurnedEth: string;
  gasBurnedUsd: string;
  swapCount: number;
  activityBreakdown: ActivityBreakdown;
  defiScore: number;
  airdropScore: number;
  degenScore: number;
  diamondHandsDays: number;
  whaleometer: number;
  uniqueProtocols: number;
  topFrenemy: string;
  topFrenemyLabel: string;
  peakHour: number;
  activityStreak: number;
  archetype: WalletArchetype;
  archetypeConfidence: number;
  signals: WalletSignals;
  evidence: AnalysisEvidence;
  rarity: string;
  sarcasticTitle: string;
}

export type WalletArchetype =
  | "The 2AM Degen"
  | "The Diamond HODLer"
  | "The Gas Warrior"
  | "The DeFi Explorer"
  | "The Micro Duster"
  | "The Tourist"
  | "The Sleepy Whale"
  | "The Yield Farmer"
  | "The Bot"
  | "The Based Chad";

export interface WalletPersonality {
  title: string;
  roast: string;
  funFacts: string[];
  verdict: string;
}

export interface TxWrapResponse {
  success: boolean;
  data?: {
    metrics: WalletMetrics;
    personality: WalletPersonality;
    slideshowUrl: string;
    markdown: string;
  };
  error?: string;
}

export interface TxWrapRequest {
  address: string;
  chainId?: string;
}

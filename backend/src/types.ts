// === Raw data from OKLink API ===

export interface OkLinkAddressProfile {
  address: string;
  balance: string;
  transactionCount: number;
  tokenHoldings: OkLinkTokenHolding[];
}

export interface OkLinkTokenHolding {
  tokenAddress: string;
  symbol: string;
  balance: string;
  usdValue?: string;
}

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

export interface OkLinkTxHistory {
  transactions: OkLinkTransaction[];
  totalCount: number;
  page: number;
  limit: number;
}

// === Computed metrics ===

export interface WalletMetrics {
  totalTx: number;
  balanceEth: string;
  balanceUsd: string;
  gasBurnedEth: string;
  gasBurnedUsd: string;
  swapCount: number;
  defiScore: number;
  airdropScore: number;
  degenScore: number;
  diamondHandsDays: number;
  whaleometer: number;
  uniqueProtocols: number;
  topFrenemy: string;
  peakHour: number;
  activityStreak: number;
  archetype: WalletArchetype;
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

// === AI Personality ===

export interface WalletPersonality {
  title: string;
  roast: string;
  funFacts: string[];
  verdict: string;
}

// === API Response ===

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

// === Request ===

export interface TxWrapRequest {
  address: string;
  chainId?: string;
}

// === OKLink API raw response shapes ===

export interface OkLinkApiResponse<T> {
  code: string;
  msg: string;
  data: T[];
}

export interface OkLinkAddressData {
  address: string;
  balance: string;
  transactionCount: number;
  tokenBalances?: OkLinkTokenBalance[];
}

export interface OkLinkTokenBalance {
  tokenContractAddress: string;
  tokenSymbol: string;
  balance: string;
  usdValue: string;
}

export interface OkLinkTxData {
  txId: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  txFee: string;
  blockHeight: number;
  transactionTime: number;
  methodId?: string;
  status: string;
}

export interface OkLinkTxHistoryData {
  transactionList: OkLinkTxData[];
  totalCount: number;
  page: number;
  limit: number;
}

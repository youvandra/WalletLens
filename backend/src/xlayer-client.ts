import crypto from "crypto";
import https from "https";
import { config } from "./config.js";

const BASE_URL = "https://web3.okx.com";

function sign(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string
): string {
  const message = timestamp + method + requestPath + body;
  const hmac = crypto.createHmac("sha256", config.xlayerSecretKey);
  hmac.update(message);
  return hmac.digest("base64");
}

function isoNow(): string {
  return new Date().toISOString().slice(0, -5) + "Z";
}

function request(method: string, path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timestamp = isoNow();
    const signature = sign(timestamp, method, path, "");

    const url = new URL(`${BASE_URL}${path}`);

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      rejectUnauthorized: true,
      headers: {
        "OK-ACCESS-KEY": config.xlayerApiKey,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-PASSPHRASE": config.xlayerPassphrase,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "User-Agent": "TxWrap/1.0",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => (data += chunk.toString()));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(
            new Error(
              `X Layer API error ${res.statusCode}: ${data.slice(0, 200)}`
            )
          );
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function apiGet<T>(path: string): Promise<T> {
  const raw = await request("GET", path);
  const json = JSON.parse(raw);

  if (json.code !== "0") {
    throw new Error(`X Layer API error: ${json.code} ${json.msg}`);
  }

  return json.data[0];
}

export interface XlayerAddressInfo {
  address: string;
  balance: string;
  balanceSymbol: string;
  transactionCount: string;
  firstTransactionTime: string;
  lastTransactionTime: string;
}

export interface XlayerTxEntry {
  txId: string;
  methodId?: string;
  height: string;
  transactionTime: string;
  from: string;
  to: string;
  amount: string;
  transactionSymbol: string;
  txFee: string;
  state: string;
  tokenContractAddress?: string;
}

export interface XlayerTxList {
  page: string;
  limit: string;
  totalPage: string;
  transactionLists: XlayerTxEntry[];
}

export async function getAddressInfo(
  address: string
): Promise<XlayerAddressInfo> {
  return apiGet<XlayerAddressInfo>(
    `/api/v5/xlayer/address/information-evm?chainShortName=xlayer&address=${address}`
  );
}

export async function getAddressTransactions(
  address: string,
  page = 1,
  limit = 50
): Promise<XlayerTxList> {
  return apiGet<XlayerTxList>(
    `/api/v5/xlayer/address/transaction-list?chainShortName=xlayer&address=${address}&page=${page}&limit=${limit}`
  );
}

// ---- Token balances (ERC-20 / -721 / -1155 holdings) ----

export interface XlayerTokenBalance {
  symbol: string;
  tokenContractAddress: string;
  tokenType: string;
  holdingAmount: string; // human-readable decimal string
  priceUsd: string;
  valueUsd: string;
  tokenId: string;
}

export interface XlayerTokenBalanceList {
  page: string;
  limit: string;
  totalPage: string;
  tokenList: XlayerTokenBalance[];
}

export async function getTokenBalances(
  address: string,
  protocolType: "token_20" | "token_721" | "token_1155" = "token_20",
  page = 1,
  limit = 50
): Promise<XlayerTokenBalanceList> {
  return apiGet<XlayerTokenBalanceList>(
    `/api/v5/xlayer/address/token-balance?chainShortName=xlayer&address=${address}&protocolType=${protocolType}&page=${page}&limit=${limit}`
  );
}

// ---- Token transfers (ERC-20 transfer history of an address) ----

export interface XlayerTokenTx {
  txId: string;
  height: string;
  transactionTime: string;
  from: string;
  to: string;
  tokenContractAddress: string;
  tokenId: string;
  amount: string; // human-readable decimal string
  symbol: string;
  isFromContract: boolean;
  isToContract: boolean;
}

export interface XlayerTokenTxList {
  page: string;
  limit: string;
  totalPage: string;
  transactionList: XlayerTokenTx[];
}

export async function getTokenTransactions(
  address: string,
  protocolType: "token_20" | "token_721" | "token_1155" = "token_20",
  page = 1,
  limit = 50
): Promise<XlayerTokenTxList> {
  return apiGet<XlayerTokenTxList>(
    `/api/v5/xlayer/address/token-transaction-list?chainShortName=xlayer&address=${address}&protocolType=${protocolType}&page=${page}&limit=${limit}`
  );
}

// ---- Internal transactions (contract-triggered) ----

export interface XlayerInternalTx {
  txId: string;
  height: string;
  transactionTime: string;
  from: string;
  to: string;
  isFromContract: boolean;
  isToContract: boolean;
  operation: string;
  amount: string;
  symbol: string;
  state: string;
}

export interface XlayerInternalTxList {
  page: string;
  limit: string;
  totalPage: string;
  transactionList: XlayerInternalTx[];
}

export async function getInternalTransactions(
  address: string,
  page = 1,
  limit = 50
): Promise<XlayerInternalTxList> {
  return apiGet<XlayerInternalTxList>(
    `/api/v5/xlayer/address/internal-transaction-list?chainShortName=xlayer&address=${address}&page=${page}&limit=${limit}`
  );
}

// ---- Cross-chain (X Layer <-> TradeZone) transfers ----

export interface XlayerCrossChainTx {
  txType: string; // "XLayerToTZ" | "TZToXLayer"
  crossType: string; // "Deposit" | "Withdraw" | "BatchWithdraw"
  status: string; // "0x1" success
  from: string;
  to: string;
  value: string;
  tokenType: string;
  tokenName: string;
  xlayerBlockTime: string;
}

export interface XlayerCrossChainList {
  page: string;
  limit: string;
  totalPage: string;
  total: string;
  data: XlayerCrossChainTx[];
}

export async function getCrossChainTransactions(
  address: string,
  page = 1,
  limit = 50
): Promise<XlayerCrossChainList> {
  return apiGet<XlayerCrossChainList>(
    `/api/v5/xlayer/tz/cross/transaction-list?chainShortName=TRADE_ZONE&address=${address}&page=${page}&limit=${limit}`
  );
}

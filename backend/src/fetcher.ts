import { config } from "./config.js";
import type {
  OkLinkApiResponse,
  OkLinkAddressData,
  OkLinkTxHistoryData,
  OkLinkTransaction,
} from "./types.js";

const BASE_URL = "https://www.oklink.com/api/v5/explorer";
const CHAIN = "XLAYER";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "OK-ACCESS-KEY": config.oklinkApiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`OKLink API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as OkLinkApiResponse<T>;
  if (json.code !== "0") {
    throw new Error(`OKLink API error: ${json.code} ${json.msg}`);
  }

  return json.data[0];
}

export async function fetchAddressProfile(address: string): Promise<OkLinkAddressData> {
  return apiGet<OkLinkAddressData>(
    `/address/address-summary?chainShortName=${CHAIN}&address=${address}`
  );
}

export async function fetchAddressTransactions(
  address: string,
  page = 1,
  limit = 50
): Promise<OkLinkTxHistoryData> {
  return apiGet<OkLinkTxHistoryData>(
    `/address/address-transaction-list?chainShortName=${CHAIN}&address=${address}&page=${page}&limit=${limit}`
  );
}

export async function fetchAllTransactions(
  address: string,
  maxPages = 10
): Promise<OkLinkTransaction[]> {
  const allTxs: OkLinkTransaction[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    const data = await fetchAddressTransactions(address, page, 50);
    const txs: OkLinkTransaction[] = data.transactionList.map((tx) => ({
      txId: tx.txId,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      txFee: tx.txFee,
      blockHeight: tx.blockHeight,
      timestamp: tx.transactionTime,
      methodId: tx.methodId,
      status: tx.status === "success" ? "success" : "fail",
    }));

    allTxs.push(...txs);
    hasMore = data.page * data.limit < data.totalCount;
    page++;
  }

  return allTxs;
}

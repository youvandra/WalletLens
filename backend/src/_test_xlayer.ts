import { getAddressInfo, getAddressTransactions } from "./xlayer-client.js";

async function main() {
  const addr = "0x69c236e021f5775b0d0328ded5eac708e3b869df";
  try {
    const info = await getAddressInfo(addr);
    console.log("INFO OK:", info.balance, info.transactionCount);

    const txs = await getAddressTransactions(addr, 1, 3);
    console.log("TXS OK:", txs.transactionLists?.length);
  } catch (e: unknown) {
    const err = e as Error;
    console.error("FAIL:", err.message.slice(0, 200));
  }
}

main();

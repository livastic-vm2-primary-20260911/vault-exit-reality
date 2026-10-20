import { inspectVault, formatUnits, describePosition } from "../src/core.mjs";
const s = await inspectVault({ chain: "ethereum", vault: "0x83F20F44975D03b1b09e64809B757c47f942BEeA" });
if (s.assetSymbol !== "DAI" || s.shareSymbol !== "sDAI" || s.totalAssets < 1n) throw Error("Unexpected sDAI metadata or RPC response");
console.log(JSON.stringify({ live: true, chainId: s.chainId, block: s.blockNumber.toString(), vault: s.vault, asset: s.asset, symbol: s.assetSymbol, totalAssets: formatUnits(s.totalAssets, s.assetDecimals), explanation: describePosition(s) }));

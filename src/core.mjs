// SPDX-License-Identifier: MIT
// Vault Exit Reality: deliberately read-only, pinned-block ERC-4626 snapshot.
export const CHAINS = Object.freeze({
  ethereum: { name: "Ethereum Mainnet", id: 1, rpc: "https://ethereum-rpc.publicnode.com", explorer: "https://etherscan.io/address/" },
  base: { name: "Base Mainnet", id: 8453, rpc: "https://mainnet.base.org", explorer: "https://basescan.org/address/" },
  arbitrum: { name: "Arbitrum One", id: 42161, rpc: "https://arb1.arbitrum.io/rpc", explorer: "https://arbiscan.io/address/" }
});
export const SELECTORS = Object.freeze({
  asset: "0x38d52e0f",
  totalAssets: "0x01e1d114",
  decimals: "0x313ce567",
  symbol: "0x95d89b41",
  balanceOf: "0x70a08231",
  maxWithdraw: "0xce96cb77",
  maxRedeem: "0xd905777e",
  previewRedeem: "0x4cdad506",
  convertToAssets: "0x07a2d13a"
});
export function requireAddress(value) {
  const v = String(value || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) throw Error("Address must contain 0x followed by exactly 40 hex characters.");
  if (/^0x0{40}$/i.test(v)) throw Error("Zero address is not a valid vault/owner.");
  return v;
}
export function encodeAddress(addr) {
  return requireAddress(addr).toLowerCase().slice(2).padStart(64, "0");
}
export function encodeUint256(value) {
  if (typeof value !== "bigint" || value < 0n || value > ((1n << 256n) - 1n)) throw Error("Invalid uint256");
  return value.toString(16).padStart(64, "0");
}
export function decodeUint(data) {
  if (typeof data !== "string" || !/^0x[0-9a-fA-F]{64,}$/.test(data) || data.length % 2 !== 0) throw Error("Invalid or absent 32-byte ABI number");
  return BigInt("0x" + data.slice(2, 66));
}
export function decodeAddress(data) {
  const v = decodeUint(data);
  if ((v >> 160n) !== 0n) throw Error("Invalid ABI address padding");
  const address = "0x" + v.toString(16).padStart(40, "0");
  return requireAddress(address);
}
export function decodeString(data) {
  if (typeof data !== "string" || !/^0x[0-9a-fA-F]{64,}$/.test(data) || data.length % 2 !== 0) throw Error("Invalid ABI string");
  const raw = data.slice(2);
  // Both Solidity dynamic string and legacy bytes32 ERC-20 symbols are supported.
  let hex;
  if (raw.length >= 128 && decodeUint("0x" + raw.slice(0, 64)) === 32n) {
    const n = decodeUint("0x" + raw.slice(64, 128));
    if (n > 96n || raw.length < 128 + Number(n) * 2) throw Error("Invalid ABI string length");
    hex = raw.slice(128, 128 + Number(n) * 2);
  } else {
    hex = raw.slice(0, 64).replace(/(00)+$/, "");
  }
  const bytes = new Uint8Array((hex.match(/.{2}/g) || []).map((v) => Number.parseInt(v, 16)));
  const s = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!s || /[\u0000-\u001f\u007f]/.test(s) || s.length > 96) throw Error("Invalid token symbol");
  return s;
}
export function formatUnits(raw, decimals, maxFraction = 6) {
  if (typeof raw !== "bigint" || raw < 0n) return "unknown";
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) return raw.toString() + " (raw units)";
  const d = BigInt(decimals);
  const scale = 10n ** d;
  const whole = (raw / scale).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = (raw % scale).toString().padStart(decimals, "0");
  const capped = fraction.slice(0, Math.min(decimals, maxFraction)).replace(/0+$/, "");
  if (!capped) return raw > 0n && raw < scale && maxFraction < decimals ? "<0." + "0".repeat(Math.max(0, maxFraction - 1)) + "1" : whole;
  return whole + "." + capped + (fraction.slice(maxFraction).replace(/0/g, "") ? "…" : "");
}
export function describePosition(s) {
  if (!s.owner) return "Enter a public owner address for its per-wallet limits. Vault-wide metadata alone cannot establish withdrawability.";
  if (s.limits.maxWithdraw === null || s.limits.maxRedeem === null || s.limits.balance === null) return "Unknown: at least one essential ERC-4626 call failed. Do not assume zero or a successful exit.";
  if (s.limits.balance === 0n) return "The owner has zero reported vault shares at the sampled block. This does not evaluate a separate withdrawal queue.";
  if (s.limits.maxWithdraw === 0n || s.limits.maxRedeem === 0n) return "At least one ERC-4626 withdrawal/redeem limit returned zero despite vault shares. The direct path may be paused, capped, queued, or restricted.";
  return "A positive limit was reported at one historical block. It is not a transaction simulation, execution guarantee, safety rating, or proof of instant liquidity.";
}
export async function rpc(url, method, params = [], timeoutMs = 10000) {
  if (!/^https:\/\//.test(url)) throw Error("HTTPS RPC is required");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw Error("RPC HTTP " + response.status);
    const data = await response.json();
    if (typeof data !== "object" || data === null || data.error || data.result === undefined || data.result === null) throw Error("RPC did not return a usable result");
    return data.result;
  } catch (error) {
    throw Error(error.name === "AbortError" ? "RPC timeout" : String(error.message || error).slice(0, 120));
  } finally {
    clearTimeout(timeout);
  }
}
export async function inspectVault({ chain = "ethereum", vault, owner = "", call = rpc }) {
  const cfg = CHAINS[chain];
  if (!cfg) throw Error("Unsupported network");
  const v = requireAddress(vault);
  const a = owner.trim() ? requireAddress(owner) : "";
  const safeRpc = (method, params) => call(cfg.rpc, method, params);
  const chainRaw = await safeRpc("eth_chainId", []);
  if (typeof chainRaw !== "string" || Number.parseInt(chainRaw, 16) !== cfg.id) throw Error("RPC chain mismatch — refusing to show cross-chain results.");
  const block = await safeRpc("eth_blockNumber", []);
  if (!/^0x[0-9a-fA-F]+$/.test(block) || BigInt(block) === 0n) throw Error("Invalid sampled block");
  const code = await safeRpc("eth_getCode", [v, block]);
  if (typeof code !== "string" || !/^0x[0-9a-fA-F]*$/.test(code) || code === "0x" || code === "0x0") throw Error("No EVM contract code at the vault address at that block.");
  const errors = [];
  async function get(to, fn, input, decode, label) {
    try {
      const raw = await safeRpc("eth_call", [{ to, data: SELECTORS[fn] + (input || "") }, block]);
      return decode(raw);
    } catch (e) {
      errors.push(label + ": " + String(e.message).slice(0, 80));
      return null;
    }
  }
  async function num(to, fn, input = "", label = fn) { return get(to, fn, input, decodeUint, label); }
  const [asset, totalAssets, shareDecimalsRaw, shareSymbol] = await Promise.all([
    get(v, "asset", "", decodeAddress, "asset"),
    num(v, "totalAssets"),
    num(v, "decimals"),
    get(v, "symbol", "", decodeString, "share symbol")
  ]);
  if (!asset || totalAssets === null) throw Error("Contract does not expose required ERC-4626 asset() and totalAssets().");
  const [assetDecimalsRaw, assetSymbol] = await Promise.all([
    num(asset, "decimals", "", "asset decimals"),
    get(asset, "symbol", "", decodeString, "asset symbol")
  ]);
  function boundedDecimals(n) { return n !== null && n >= 0n && n <= 36n ? Number(n) : null; }
  const shareDecimals = boundedDecimals(shareDecimalsRaw);
  const assetDecimals = boundedDecimals(assetDecimalsRaw);
  if (shareDecimals === null) errors.push("Share token decimals unknown; values will stay raw.");
  if (assetDecimals === null) errors.push("Underlying asset decimals unknown; values will stay raw.");
  const limits = { balance: null, maxWithdraw: null, maxRedeem: null, previewRedeem: null, balanceAsAssets: null };
  if (a) {
    const encoded = encodeAddress(a);
    [limits.balance, limits.maxWithdraw, limits.maxRedeem] = await Promise.all([
      num(v, "balanceOf", encoded, "owner share balance"),
      num(v, "maxWithdraw", encoded, "owner maxWithdraw"),
      num(v, "maxRedeem", encoded, "owner maxRedeem")
    ]);
    const extra = [];
    if (limits.maxRedeem !== null && limits.maxRedeem > 0n) {
      extra.push(num(v, "previewRedeem", encodeUint256(limits.maxRedeem), "previewRedeem").then((n) => { limits.previewRedeem = n; }));
    }
    if (limits.balance !== null && limits.balance > 0n) {
      extra.push(num(v, "convertToAssets", encodeUint256(limits.balance), "convertToAssets").then((n) => { limits.balanceAsAssets = n; }));
    }
    await Promise.all(extra);
  }
  return {
    chain, chainId: cfg.id, rpc: cfg.rpc, block, blockNumber: BigInt(block), vault: v, owner: a, asset,
    totalAssets, assetSymbol, shareSymbol, assetDecimals, shareDecimals, limits, errors
  };
}
export function serializeSnapshot(s) {
  return {
    product: "Vault Exit Reality", schema: 1, warning: "Read-only ERC-4626 calls at one block; NOT execution, liquidity, protocol-security, or financial advice.",
    chain: s.chain, chainId: s.chainId, blockNumber: s.blockNumber.toString(), rpc: s.rpc,
    vault: s.vault, owner: s.owner || null, asset: s.asset,
    assetSymbol: s.assetSymbol, shareSymbol: s.shareSymbol,
    assetDecimals: s.assetDecimals, shareDecimals: s.shareDecimals,
    totalAssetsRaw: s.totalAssets.toString(),
    balanceSharesRaw: s.limits.balance === null ? null : s.limits.balance.toString(),
    maxWithdrawAssetsRaw: s.limits.maxWithdraw === null ? null : s.limits.maxWithdraw.toString(),
    maxRedeemSharesRaw: s.limits.maxRedeem === null ? null : s.limits.maxRedeem.toString(),
    previewRedeemAssetsRaw: s.limits.previewRedeem === null ? null : s.limits.previewRedeem.toString(),
    balanceAsAssetsRaw: s.limits.balanceAsAssets === null ? null : s.limits.balanceAsAssets.toString(),
    warnings: s.errors,
    explanation: describePosition(s)
  };
}

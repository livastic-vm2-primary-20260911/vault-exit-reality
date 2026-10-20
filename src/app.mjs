import {CHAINS, inspectVault, formatUnits, describePosition, serializeSnapshot} from "./core.mjs";
const find = (id) => document.getElementById(id);
const form = find("checker");
let last = null;
function row(label, value, hint) {
  const div = document.createElement("div");
  div.className = "metric";
  const l = document.createElement("div");
  l.className = "label"; l.textContent = label;
  const strong = document.createElement("strong"); strong.textContent = value;
  const small = document.createElement("small"); small.textContent = hint;
  div.append(l, strong, small);
  return div;
}
function showError(message) {
  last = null;
  find("result-tag").textContent = "NOT VERIFIED";
  find("result-message").textContent = "No dependable snapshot was obtained: " + message;
  find("result-message").hidden = false;
  find("result-data").hidden = true;
}
function showSnapshot(snapshot) {
  last = snapshot;
  const cfg = CHAINS[snapshot.chain];
  const {limits, assetDecimals, shareDecimals} = snapshot;
  find("result-message").hidden = true;
  find("result-data").hidden = false;
  find("result-tag").textContent = "READ-ONLY · BLOCK " + snapshot.blockNumber.toString();
  const summary = find("summary");
  summary.textContent = describePosition(snapshot);
  summary.className = snapshot.errors.length || (snapshot.owner && (limits.maxWithdraw === 0n || limits.maxRedeem === 0n)) ? "summary warning" : "summary";
  const metrics = find("metrics");
  metrics.replaceChildren(
    row("Vault-managed assets", formatUnits(snapshot.totalAssets, assetDecimals), snapshot.assetSymbol || "underlying token unknown"),
    row("Your reported vault shares", limits.balance === null ? (snapshot.owner ? "Unknown" : "Add owner") : formatUnits(limits.balance, shareDecimals), snapshot.shareSymbol || "share token unknown"),
    row("maxWithdraw(owner) · underlying", limits.maxWithdraw === null ? (snapshot.owner ? "Unknown" : "Add owner") : formatUnits(limits.maxWithdraw, assetDecimals), "Contract-declared direct withdraw ceiling"),
    row("maxRedeem(owner) · shares", limits.maxRedeem === null ? (snapshot.owner ? "Unknown" : "Add owner") : formatUnits(limits.maxRedeem, shareDecimals), "Contract-declared redeem ceiling"),
    row("previewRedeem(maxRedeem)", limits.previewRedeem === null ? "Unknown / not run" : formatUnits(limits.previewRedeem, assetDecimals), "Estimate only; does NOT apply exit limits"),
    row("convertToAssets(all shares)", limits.balanceAsAssets === null ? "Unknown / not run" : formatUnits(limits.balanceAsAssets, assetDecimals), "Ideal share conversion; may omit fees")
  );
  const meta = find("block-meta");
  meta.replaceChildren();
  const lines = [
    "Network: " + cfg.name + " · RPC: " + cfg.rpc,
    "Read block: " + snapshot.blockNumber.toString() + " (all calls pinned to this block)",
    "Vault: " + snapshot.vault,
    "Asset: " + snapshot.asset + " · " + (snapshot.assetSymbol || "symbol unknown"),
    "Wallet owner: " + (snapshot.owner || "not supplied")
  ];
  lines.forEach((v) => { const line = document.createElement("div"); line.textContent = v; meta.append(line); });
  const errors = find("errors");
  errors.hidden = snapshot.errors.length === 0;
  errors.textContent = snapshot.errors.length ? "Some calls were unavailable (unknown, not zero): " + snapshot.errors.join(" | ") : "";
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const btn = find("scan");
  btn.disabled = true;
  btn.textContent = "Reading chain…";
  find("result-tag").textContent = "READING";
  find("result-message").hidden = false;
  find("result-message").textContent = "Verifying chain ID, block height and contract code, then reading only the ERC-4626 view methods.";
  find("result-data").hidden = true;
  last = null;
  try {
    const s = await inspectVault({chain: find("chain").value, vault: find("vault").value, owner: find("owner").value});
    showSnapshot(s);
  } catch (e) {
    showError(String(e.message).slice(0, 190));
  } finally {
    btn.disabled = false;
    btn.textContent = "Read on-chain state →";
  }
});
find("demo").addEventListener("click", () => {
  find("chain").value = "ethereum";
  find("vault").value = "0x83F20F44975D03b1b09e64809B757c47f942BEeA";
  find("owner").value = "";
  find("result-message").hidden = false;
  find("result-message").textContent = "Public example loaded: sDAI ERC-4626 on Ethereum. Verify this address independently and click Read on-chain state. No wallet owner is selected.";
  find("result-data").hidden = true;
  find("result-tag").textContent = "EXAMPLE READY";
  last = null;
});
find("download").addEventListener("click", () => {
  if (!last) return;
  const json = JSON.stringify(serializeSnapshot(last), null, 2) + "\n";
  const url = URL.createObjectURL(new Blob([json], {type: "application/json"}));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "vault-exit-evidence-" + last.chain + "-" + last.blockNumber.toString() + ".json";
  document.body.append(anchor); anchor.click(); anchor.remove();
  URL.revokeObjectURL(url);
});

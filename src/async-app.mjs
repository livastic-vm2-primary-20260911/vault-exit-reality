// Small stand-alone browser UI for ERC-7540 queued redemption reads.
// No wallet, transactions, server storage, analytics, or network except the
// public RPC explicitly selected when a visitor requests a read-only check.
import {CHAINS} from "./core.mjs";
import {inspectAsyncRedeem, serializeAsyncEvidence} from "./async-redeem.mjs";

const node = id => document.getElementById(id);
const form = node("async-form");
let priorVaultSnapshot = null;
let lastAsync = null;
document.addEventListener("vault-read-snapshot", event => {
  const s = event.detail;
  if (!s || !CHAINS[s.chain] || !/^0x[0-9a-fA-F]+$/.test(s.block)) return;
  priorVaultSnapshot = {
    chain: s.chain, vault: s.vault.toLowerCase(), block: s.block
  };
});

function panel(label, value, hint) {
  const el=document.createElement("div");
  el.className="metric";
  const smallLabel=document.createElement("div");smallLabel.className="label";smallLabel.textContent=label;
  const strong=document.createElement("strong");strong.textContent=value;
  const text=document.createElement("small");text.textContent=hint;
  el.append(smallLabel,strong,text);
  return el;
}
function safeError(message) {
  lastAsync=null;
  node("async-status").textContent="NOT VERIFIED";
  node("async-text").textContent="No dependable async request snapshot obtained: "+String(message).slice(0,180);
  node("async-evidence").hidden=true;
  node("async-text").hidden=false;
}
function render(report) {
  lastAsync=report;
  const active=report.interfaceState==="DECLARED_ASYNC_REDEEM";
  const okay=active && report.pendingShares!==null && report.claimableShares!==null;
  node("async-status").textContent=active ? "ERC-7540 INTERFACE DECLARED · BLOCK "+report.blockNumber :
    "ASYNC SUPPORT NOT CONFIRMED";
  node("async-text").hidden=true;
  node("async-evidence").hidden=false;
  const blurb=node("async-summary");
  blurb.className=okay ? "summary" : "summary warning";
  blurb.textContent=report.explanation;
  const metrics=node("async-metrics");
  const raw = value => value === null ? "Unknown / not read" : value.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")+" raw shares";
  metrics.replaceChildren(
    panel("pendingRedeemRequest(id, controller)",raw(report.pendingShares),
       "ERC-7540 Pending shares, NOT underlying assets"),
    panel("claimableRedeemRequest(id, controller)",raw(report.claimableShares),
       "ERC-7540 Claimable shares, NOT redeemable tokens")
  );
  const meta=node("async-details");
  meta.replaceChildren();
  const attrs=[
    "Network: "+CHAINS[report.chain].name+" · sampled block #"+report.blockNumber.toString(),
    "Vault: "+report.vault,
    "Public request controller: "+report.controller,
    "Request ID: "+report.requestId,
    "ERC-165 async redeem interface: "+String(report.erc165Probes["0x620ee8e4"]),
    "Common operator support: "+String(report.erc165Probes["0xe3bc4e65"]),
    "ERC-7575 share interface: "+String(report.erc165Probes["0x2f0a18c5"]),
    "RPC: "+report.rpc+" (your public query is visible to this provider)",
    "These are raw SHARE uint256 amounts. Vault and share token may differ under ERC-7575; no decimals were assumed."
  ];
  attrs.forEach(text => {
    const div=document.createElement("div");
    div.textContent=text;
    meta.append(div);
  });
  const warnings=node("async-errors");
  warnings.hidden=report.warnings.length===0;
  warnings.textContent=report.warnings.length ?
    "Unverified calls: "+report.warnings.join(" | ") : "";
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const button=node("async-run");
  const chain=node("chain").value;
  const vault=node("vault").value.trim();
  const controller=node("async-controller").value.trim();
  const requestId=node("async-request-id").value.trim();
  const compatible = priorVaultSnapshot && priorVaultSnapshot.chain===chain &&
    priorVaultSnapshot.vault===vault.toLowerCase();
  button.disabled=true;
  button.textContent="Reading ERC-7540…";
  lastAsync=null;
  node("async-status").textContent="QUERY IN PROGRESS";
  node("async-text").textContent="Checking ERC-165 interfaces before querying any request state. All calls are read-only and pinned to one block.";
  node("async-text").hidden=false;
  node("async-evidence").hidden=true;
  try{
    const report=await inspectAsyncRedeem({
      chain,vault,controller,requestId,
      blockTag:compatible ? priorVaultSnapshot.block : null
    });
    render(report);
  }catch(error){
    safeError(error?.message ?? "Unknown RPC error");
  }finally{
    button.disabled=false;
    button.textContent="Check pending & claimable shares →";
  }
});
node("async-demo").addEventListener("click",()=>{
  node("chain").value="ethereum";
  node("vault").value="0xfe6920eb6c421f1179ca8c8d4170530cdbdfd77a";
  node("async-controller").value="0x000000000000000000000000000000000000dEaD";
  node("async-request-id").value="0";
  lastAsync=null;
  node("async-status").textContent="PUBLIC EXAMPLE READY";
  node("async-evidence").hidden=true;
  node("async-text").hidden=false;
  node("async-text").textContent="Official Centrifuge Ethereum JTRSY/USDC vault loaded with a PUBLIC PLACEHOLDER controller (0x…dEaD), not an investor. Request ID 0 is illustrative and may be wrong for real positions. Click Check to read interface support only; zero for this placeholder tells you NOTHING about a real person's requests.";
});
node("async-download").addEventListener("click",()=>{
  if(!lastAsync)return;
  const payload=JSON.stringify(serializeAsyncEvidence(lastAsync),null,2)+"\n";
  const url=URL.createObjectURL(new Blob([payload],{type:"application/json"}));
  const a=document.createElement("a");
  a.href=url;
  a.download="erc7540-request-evidence-"+lastAsync.chain+"-"+lastAsync.blockNumber.toString()+".json";
  document.body.append(a);a.click();a.remove();
  URL.revokeObjectURL(url);
});

#!/usr/bin/env node
/**
 * Generate a genuine Ethereum-mainnet, vault-level read-only sample.
 * No owner wallet, no signing, no payment, no token movement, no analytics.
 * Single RPC provenance is explicitly NOT an independent finality proof.
 */
import fs from "node:fs";
import {inspectVault,serializeSnapshot,formatUnits} from "../src/core.mjs";

const vault="0x83F20F44975D03b1b09e64809B757c47f942BEeA";
const sampled=await inspectVault({chain:"ethereum",vault});
if(sampled.chainId!==1 || sampled.owner || sampled.totalAssets===null ||
   sampled.totalAssets<=0n || sampled.assetDecimals===null ||
   sampled.asset.toLowerCase()!=="0x6b175474e89094c44da98b954eedeac495271d0f" ||
   sampled.assetSymbol!=="DAI" || sampled.shareSymbol!=="sDAI" ||
   sampled.errors.length) throw Error("Mainnet sample evidence missing or inconsistent: refuse to publish");
const observedAt=new Date().toISOString();
const evidence={
 ...serializeSnapshot(sampled),
 evidenceKind:"PUBLIC_ONCHAIN_ONE_RPC_ONE_BLOCK_METADATA_ONLY",
 inspectedAtUtc:observedAt,
 readOnly:true,
 noOwnerSupplied:true,
 noDepositMade:true,
 noWalletSignature:true,
 actualOnchainTransactionExecuted:false,
 independentlyFinalizedByMultipleProviders:false,
 cannotInferAnyOwnersWithdrawability:true,
 revenueGeneratedByInspection:"0",
 evidenceMethod:"Single public HTTPS JSON-RPC source, checked eth_chainId, eth_blockNumber, deployed bytecode and pinned eth_call on asset(), totalAssets(), decimals(), symbol(); no owner position was queried",
 standards:[
  "https://eips.ethereum.org/EIPS/eip-4626",
  "https://eips.ethereum.org/EIPS/eip-7540"
 ],
 materialLimitations:[
  "This is a historical sampled block, not a live quote, guaranteed vault liquidity, or an audit.",
  "Without a voluntarily supplied public owner address, maxWithdraw(owner), maxRedeem(owner), balanceOf(owner), and previewRedeem are NOT evaluated; null is unknown, not zero.",
  "totalAssets is a contract-reported accounting value, not proof of available cash to withdraw.",
  "Unverified proxy upgrades, offchain constraints, async queues, restrictions, pauses, reorgs or a malicious contract may change actual exit behavior.",
  "For ERC-7540 asynchronous redemptions, previewRedeem can revert by design. This sample does not check withdrawal requests, pending/claimable balances or queue position.",
  "Do not send funds or sign approval transactions in reliance on this informational sample."
 ]
};
const escapeHtml=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const field=(label,val,note)=>`<div class="sample-row"><span class="sample-label">${escapeHtml(label)}</span><strong>${escapeHtml(val)}</strong><small>${escapeHtml(note)}</small></div>`;
const block=evidence.blockNumber;
const body=`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="description" content="A real single-block public Ethereum sDAI ERC-4626 metadata sample with strict unknowns, source evidence and read-only caveats.">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; script-src 'none'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>Sample report — read-only sDAI vault evidence | Vault Exit Reality</title>
<link rel="stylesheet" href="../style.css"><link rel="stylesheet" href="./sample.css">
</head><body>
<header class="header"><a class="brand" href="../"><span class="mark">V/</span><span>VAULT EXIT<br><b>REALITY</b></span></a><span class="header-meta"><span class="dot"></span> REAL MAINNET READ · NO OWNER POSITION</span></header>
<main>
<section class="sample-hero">
<div class="eyebrow">FREE EXAMPLE REPORT / NO TRANSACTION</div>
<h1>What an actual vault evidence brief looks like.</h1>
<p>This report queried the public sDAI vault contract on Ethereum at one chain-verified historical block. It provides <strong>vault metadata only</strong>, not a holder's withdrawable funds, liquidity guarantee, security rating or financial advice. No wallet was connected, no signature was requested and no funds moved.</p>
<div class="read-note"><b>Evidence collected:</b> ${escapeHtml(observedAt)} UTC · Block #${escapeHtml(block)} · Read-only Ethereum mainnet · Single public RPC observation</div>
</section>
<section class="sample-layout">
<article class="card">
<h2><span class="step">01</span> Reproducible facts</h2>
<div class="sample-grid">
${field("Reported vault share token",sampled.shareSymbol,"ERC-20 share label from symbol()")}
${field("Underlying asset",sampled.assetSymbol,"Underlying token from asset() and symbol()")}
${field("Vault accounting totalAssets()",formatUnits(sampled.totalAssets,sampled.assetDecimals),"NOT a withdrawable-liquidity promise")}
${field("ERC-4626 asset decimals",sampled.assetDecimals,"Required to convert raw integer units")}
${field("Vault address",sampled.vault,"Contract code checked at sampled block")}
${field("Underlying token contract",sampled.asset,"Token label alone is insufficient identity")}
${field("Read block number",block,"All view calls pinned to this exact block")}
${field("RPC provenance",sampled.rpc,"Single provider observation, NOT independent consensus proof")}
</div>
<p class="sample-note">These figures and addresses were generated by a reproducible read-only script. Source-routed view methods report data claimed by the contract and public RPC, not whether that contract is trustworthy or a position is safe.</p>
</article>
<article class="card">
<h2><span class="step">02</span> Limits deliberately not invented</h2>
<div class="unknown"><b>Owner address: NOT PROVIDED</b><p>Owner shares, maxWithdraw(owner), maxRedeem(owner), previewRedeem, and convertToAssets(owner shares) are <strong>UNKNOWN / NOT RUN</strong>, not zero. Vault accounting totals alone cannot establish any investor's ability to withdraw.</p></div>
<h3>What requires additional verification?</h3>
<ul class="risk-list"><li>Whether direct synchronous withdrawals are enabled for a particular holder.</li><li>Queues/cooldowns, withdrawals requiring a request/claim lifecycle, and per-owner restrictions.</li><li>Proxy changes, permission checks, paused exits, slippage/gas and actual redeem transaction behavior.</li><li>Fresh chain receipts/finality at the time of any *separately authorized* transaction.</li></ul>
<p>ERC-7540 asynchronous vaults can require a separate redemption request and claim. For such vaults, previewRedeem may revert by design; a view-method failure is not proof of theft or guaranteed future liquidity.</p>
</article>
</section>
<section class="sample-bottom">
<h2><span class="step">03</span> What a scoped human-readable paid brief adds</h2>
<p>For a real independent buyer who agrees to a written scope, an optional 19 native Circle Base USDC pilot could add one public owner address, owner-specific ERC-4626 limits at a new pinned block, protocol-specific public withdrawal documentation, source-linked uncertainty notes, and one question-specific review. It would still not be a protocol audit or a guaranteed successful exit. No fee is charged by viewing this example.</p>
<p><a href="./sDAI-ethereum-mainnet-evidence.json">Open raw evidence JSON ↗</a> · <a href="https://eips.ethereum.org/EIPS/eip-4626" rel="noopener noreferrer" target="_blank">ERC-4626 standard ↗</a> · <a href="https://eips.ethereum.org/EIPS/eip-7540" rel="noopener noreferrer" target="_blank">ERC-7540 async standard ↗</a></p>
<p class="sample-buttons"><a class="order" href="../contact.html">Ask a public technical question ↗</a> <a class="secondary-link" href="../">Use the live free read-only checker ↗</a></p>
</section>
</main><footer><span>V/ VAULT EXIT REALITY · ACTUAL RPC METADATA, NOT USER FINANCIAL DATA</span><span>NO TRACKING · NO TRANSACTIONS</span></footer>
</body></html>`;
const css=`.sample-hero{padding:65px 0 35px}.sample-hero h1{font-size:clamp(2rem,4.1vw,3.65rem);letter-spacing:-.052em;max-width:860px;margin:14px 0}.sample-hero p{color:#b3c1ce;max-width:850px;line-height:1.8;font-size:.94rem}.sample-hero strong{color:#e9efda}.read-note{padding:15px 18px;border:1px solid #395346;background:#1a2e27;border-radius:7px;color:#b2c7bb;font-size:.73rem;line-height:1.8;margin-top:28px}.sample-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:22px}.sample-layout h2,.sample-bottom h2{display:flex;align-items:center;gap:12px;font-size:1.2rem;margin:0 0 24px}.sample-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.sample-row{padding:14px 13px;border:1px solid #33434c;border-radius:7px;background:#0b131b;min-height:110px}.sample-row span,.sample-row strong,.sample-row small{display:block;overflow-wrap:anywhere}.sample-row span{font-size:.68rem;color:#91a9b8}.sample-row strong{font-size:.94rem;margin-top:12px;color:#dff6cf}.sample-row small{font-size:.67rem;color:#8294a4;margin-top:7px;line-height:1.5}.sample-note,.sample-layout p{line-height:1.8;color:#b2c2ca;font-size:.79rem}.unknown{border:1px solid #796044;border-radius:8px;background:#30251a;padding:18px}.unknown b{color:#ffdfa8;font-size:.84rem}.unknown strong{color:#ffdfae}.sample-layout h3{font-size:1rem;margin:29px 0 15px}.risk-list{padding-left:20px;line-height:1.8;color:#b6c5cc;font-size:.79rem}.risk-list li{margin-bottom:12px}.sample-bottom{border-top:1px solid #33424c;margin-top:55px;padding-top:36px}.sample-bottom p{color:#acbfca;font-size:.84rem;line-height:1.9;max-width:900px}.sample-buttons{margin-top:28px!important;display:flex;align-items:center;gap:22px;flex-wrap:wrap}.secondary-link{font-weight:700}@media(max-width:830px){.sample-layout{grid-template-columns:1fr}.sample-grid{grid-template-columns:1fr}.sample-hero{padding-top:40px}}@media print{body{background:white;color:#111}.card{background:white;color:#111;box-shadow:none}.sample-row{background:#fff;color:#111}}`;
fs.mkdirSync(new URL("../sample-brief/",import.meta.url),{recursive:true});
fs.writeFileSync(new URL("../sample-brief/sDAI-ethereum-mainnet-evidence.json",import.meta.url),JSON.stringify(evidence,null,2)+"\n");
fs.writeFileSync(new URL("../sample-brief/index.html",import.meta.url),body);
fs.writeFileSync(new URL("../sample-brief/sample.css",import.meta.url),css);
console.log(JSON.stringify({readOnlySample:true,chainId:evidence.chainId,blockNumber:block,inspectedAtUtc:observedAt,assetSymbol:sampled.assetSymbol,shareSymbol:sampled.shareSymbol,errors:sampled.errors,ownerSupplied:!!sampled.owner,sourceRpc:evidence.rpc,totalAssetsReported:formatUnits(sampled.totalAssets,sampled.assetDecimals)}));

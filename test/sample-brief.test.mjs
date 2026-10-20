import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=new URL("../",import.meta.url);
const json=JSON.parse(fs.readFileSync(new URL("sample-brief/sDAI-ethereum-mainnet-evidence.json",root),"utf8"));
const html=fs.readFileSync(new URL("sample-brief/index.html",root),"utf8");
const css=fs.readFileSync(new URL("sample-brief/sample.css",root),"utf8");
const home=fs.readFileSync(new URL("index.html",root),"utf8");
const contact=fs.readFileSync(new URL("contact.html",root),"utf8");
const sitemap=fs.readFileSync(new URL("sitemap.xml",root),"utf8");
const script=fs.readFileSync(new URL("scripts/build-verified-sample.mjs",root),"utf8");
test("metadata is pinned to actual Ethereum mainnet chain and a positive block number",()=>{
 assert.equal(json.chainId,1);
 assert.equal(json.chain,"ethereum");
 assert.match(json.blockNumber,/^[1-9][0-9]+$/);
 assert.match(json.rpc,/^https:\/\//);
 assert.equal(json.product,"Vault Exit Reality");
 assert.equal(json.evidenceKind,"PUBLIC_ONCHAIN_ONE_RPC_ONE_BLOCK_METADATA_ONLY");
 assert.equal(json.readOnly,true);
});
test("verified input contains correct sDAI vault and DAI ERC-20 asset, not ticker-only identification",()=>{
 assert.equal(json.vault.toLowerCase(),"0x83f20f44975d03b1b09e64809b757c47f942beea");
 assert.equal(json.asset.toLowerCase(),"0x6b175474e89094c44da98b954eedeac495271d0f");
 assert.equal(json.shareSymbol,"sDAI");
 assert.equal(json.assetSymbol,"DAI");
 assert.equal(json.assetDecimals,18);
 assert.match(json.totalAssetsRaw,/^[1-9][0-9]{15,}$/);
 assert.deepEqual(json.warnings,[]);
});
test("report contains no invented owner withdrawal result, signature or cashflow",()=>{
 assert.equal(json.owner,null);
 assert.equal(json.noOwnerSupplied,true);
 assert.equal(json.balanceSharesRaw,null);
 assert.equal(json.maxWithdrawAssetsRaw,null);
 assert.equal(json.maxRedeemSharesRaw,null);
 assert.equal(json.previewRedeemAssetsRaw,null);
 assert.equal(json.balanceAsAssetsRaw,null);
 assert.equal(json.cannotInferAnyOwnersWithdrawability,true);
 assert.equal(json.independentlyFinalizedByMultipleProviders,false);
 assert.equal(json.actualOnchainTransactionExecuted,false);
 assert.equal(json.noWalletSignature,true);
 assert.equal(json.noDepositMade,true);
 assert.equal(json.revenueGeneratedByInspection,"0");
});
test("historic data timestamp valid and prominent on page; block pinned",()=>{
 assert(!Number.isNaN(new Date(json.inspectedAtUtc).getTime()));
 assert.match(html,new RegExp(json.blockNumber));
 assert(html.includes(json.inspectedAtUtc));
 assert.match(html,/historical block/);
 assert.match(html,/single public RPC/i);
});
test("report shows UNKNOWN owner limits rather than zero or guaranteed exit",()=>{
 assert.match(html,/UNKNOWN \/ NOT RUN/);
 assert.match(html,/not zero/i);
 assert.match(html,/not a holder.s withdrawable funds/i);
 assert.match(html,/not be a protocol audit/i);
});
test("all cited sources are standards and internal first-party website only",()=>{
 assert.deepEqual(json.standards,[
 "https://eips.ethereum.org/EIPS/eip-4626",
 "https://eips.ethereum.org/EIPS/eip-7540"
 ]);
 assert(html.includes("https://eips.ethereum.org/EIPS/eip-4626"));
 assert(html.includes("https://eips.ethereum.org/EIPS/eip-7540"));
});
test("sample has no client script, analytics, RPC requests, remote images or form",()=>{
 assert(!/<script\b/i.test(html));
 assert(!/<form\b/i.test(html));
 assert(!/analytics\.js|GoogleAnalytics|gtag\(/i.test(html+css));
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/script-src 'none'/);
 assert.match(html,/form-action 'none'/);
});
test("source generator reads only public mainnet and rejects unexpected asset metadata",()=>{
 assert.match(script,/inspectVault\(\{chain:"ethereum",vault\}\)/);
 assert.match(script,/pinned eth_call on asset/);
 assert.match(script,/!==1/);
 assert.match(script,/sampled.owner\s*\|\|/);
 assert(!/eth_sendTransaction|eth_sendRawTransaction|privateKey|seedPhrase/.test(script));
});
test("free-to-paid discovery is visible and has voluntary email quote only",()=>{
 assert(home.includes('href="./sample-brief/"'));
 assert(contact.includes('href="./sample-brief/"'));
 assert(html.includes('href="../contact.html"'));
 assert(html.includes("optional 19 native Circle Base USDC pilot"));
 assert(html.includes("No fee is charged"));
});
test("sitemap advertises five original owner canonical paths, not outsider URLs",()=>{
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(urls.length,5);
 assert(urls.every(u=>u.startsWith("https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/")));
 assert(urls.some(u=>u.endsWith("/sample-brief/")));
});

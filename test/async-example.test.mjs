import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=new URL("../",import.meta.url);
const file=p=>fs.readFileSync(new URL(p,root),"utf8");
const html=file("index.html"),contact=file("contact.html"),sitemap=file("sitemap.xml");
const sample=file("sample-async/index.html");
const sampleJson=JSON.parse(file("sample-async/centrifuge-jtrsy-ethereum-erc7540-evidence.json"));
const core=file("src/async-redeem.mjs"),client=file("src/async-app.mjs");
const generator=file("scripts/build-async-sample.mjs");
test("real onchain evidence identifies a documented Ethereum vault with positive ERC-7540 support",()=>{
 assert.equal(sampleJson.evidenceKind,"REAL_ETHEREUM_MAINNET_ERC7540_WITH_NONINVESTOR_PLACEHOLDER");
 assert.equal(sampleJson.chain,"ethereum");
 assert.equal(sampleJson.chainId,1);
 assert.equal(sampleJson.interfaceState,"DECLARED_ASYNC_REDEEM");
 assert.equal(sampleJson.erc165Probes["0x620ee8e4"],true);
 assert.equal(sampleJson.erc165Probes["0xe3bc4e65"],true);
 assert.equal(sampleJson.erc165Probes["0x2f0a18c5"],true);
 assert.equal(sampleJson.erc165Probes["0xffffffff"],false);
 assert.equal(sampleJson.vault.toLowerCase(),"0xfe6920eb6c421f1179ca8c8d4170530cdbdfd77a");
 assert.match(sampleJson.blockNumber,/^[1-9][0-9]*$/);
 assert(!Number.isNaN(new Date(sampleJson.inspectedAtUtc).valueOf()));
});
test("public placeholder is explicitly NOT an investor, request ID or payout",()=>{
 assert.equal(sampleJson.controllerIsOnlyPublicPlaceholder,true);
 assert.equal(sampleJson.controllerKnownToHaveRealRequest,false);
 assert.equal(sampleJson.requestIdIsAnAuthenticatedInvestorRequest,false);
 assert.equal(sampleJson.noRealInvestorBalanceOrRedemptionDemonstrated,true);
 assert.equal(sampleJson.controller.toLowerCase(),"0x000000000000000000000000000000000000dead");
 assert.equal(sampleJson.requestId,"0");
 assert.equal(sampleJson.pendingRedeemSharesRaw,"0");
 assert.equal(sampleJson.claimableRedeemSharesRaw,"0");
 assert.equal(sampleJson.newIndependentUserPaidUSDC,"0.000000");
 assert.equal(sampleJson.actualClaimExecutionVerified,false);
 assert.equal(sampleJson.walletSigned,false);
 assert.equal(sampleJson.externalPaymentMade,false);
});
test("static page never describes placeholder as a real investor or guaranteed withdrawal",()=>{
 assert.match(sample,/Fictional controller/i);
 assert.match(sample,/NOT an actual customer's public controller/);
 assert.match(sample,/Both returned zero for this artificial controller/);
 assert.match(sample,/says nothing about real customers/);
 assert.match(sample,/not a guarantee/i);
 assert.match(sample,/not a contract/i);
});
test("raw JSON and official issuer/EIP citations are linked from static sample",()=>{
 assert.match(sample,/centrifuge-jtrsy-ethereum-erc7540-evidence\.json/);
 assert.equal(sampleJson.officialVaultRegistry,"https://developer.centrifuge.io/developer/protocol/deployments/");
 assert.equal(sampleJson.officialSpec,"https://eips.ethereum.org/EIPS/eip-7540");
 assert(sample.includes("https://eips.ethereum.org/EIPS/eip-7540"));
 assert(sample.includes("https://developer.centrifuge.io/developer/protocol/deployments/"));
});
test("ERC-7540 optional interface checker does not auto-connect, claim or sign",()=>{
 assert.match(html,/id="async-form"/);
 assert.match(html,/id="async-controller"/);
 assert.match(html,/id="async-request-id"/);
 assert.match(html,/id="async-demo"/);
 assert.match(html,/id="async-evidence"/);
 assert.match(html,/id="async-download"/);
 assert.match(html,/src="\.\/src\/async-app\.mjs"/);
 assert.match(html,/href="\.\/async\.css"/);
 assert.match(html,/unknown/i);
 assert(!/ethereum\.request.*eth_sendTransaction|window\.ethereum/i.test(client));
 assert(!/fetch\s*\(|localStorage/.test(client));
 assert(!/requestRedeem\s*\(/.test(client));
});
test("demo button pre-fills public dummy but DOES NOT submit it automatically",()=>{
 assert.match(client,/node\("async-demo"\)\.addEventListener\("click"/);
 assert.match(client,/0xfe6920eb6c421f1179ca8c8d4170530cdbdfd77a/);
 assert.match(client,/0x000000000000000000000000000000000000dEaD/);
 assert.match(client,/PUBLIC PLACEHOLDER/);
 const demoBlock=client.split('node("async-demo").addEventListener("click"')[1].split('node("async-download")')[0];
 assert(!demoBlock.includes("form.submit"));
 assert(!demoBlock.includes("inspectAsyncRedeem("));
});
test("read-only output distinguishes unsupported interface and null/error from zero",()=>{
 assert.match(core,/interfaceState/);
 assert.match(core,/REDEEM_INTERFACE_FALSE/);
 assert.match(core,/NOT_CONFIRMED/);
 assert.match(core,/pendingShares = null/);
 assert.match(core,/claimableShares = null/);
 assert.match(core,/No exact 32-byte ABI return word/);
 assert.match(core,/Claiming still requires a separate authorized transaction/);
});
test("evidence generator never asks for keys or transacts",()=>{
 assert.match(generator,/inspectAsyncRedeem/);
 assert.match(generator,/chain:"ethereum"/);
 assert(!/fetch\s*\(/.test(generator));
 for(const bad of ["eth_sendRawTransaction","eth_sendTransaction","privateKey","mnemonic","wallet.sign"])
   assert(!generator.includes(bad));
 assert.match(generator,/response\.warnings\.length/);
});
test("static example contains only first party code/assets; no cookies/forms/trackers",()=>{
 assert(!/<script\b/i.test(sample));
 assert(!/<form\b/i.test(sample));
 assert.match(sample,/script-src 'none'/);
 assert.match(sample,/connect-src 'none'/);
 assert.match(sample,/form-action 'none'/);
 assert(!/ga\(|gtag\(|facebookpixel|analytics\.js/i.test(sample));
});
test("new sample and existing free human inquiry listed in sitemap",()=>{
 const urls=[...sitemap.matchAll(/<url>/g)];
 assert.equal(urls.length,4);
 assert(sitemap.includes("vault-exit-reality/sample-brief/"));
 assert(sitemap.includes("vault-exit-reality/sample-async/"));
 assert(contact.includes('href="./sample-async/"'));
 assert(html.includes('href="./sample-async/"'));
});
test("no new charge or conversion asserted just for viewing educational sample",()=>{
 assert.match(sample,/charges nothing/);
 assert.match(sample,/not an actual/i);
 assert.match(sample,/written.*refund terms/i);
 assert.match(sample,/no checkout/i);
});

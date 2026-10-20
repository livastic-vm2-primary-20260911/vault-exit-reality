import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {zeroLimitContext,MORPHO_V2_OFFICIAL_GUIDE} from "../src/zero-limit-context.mjs";
const snapshot=(overrides={})=>({
  owner:"0x000000000000000000000000000000000000dEaD",
  vault:"0x83F20F44975D03b1b09e64809B757c47f942BEeA",
  chain:"ethereum",
  limits:{balance:100n,maxWithdraw:0n,maxRedeem:0n,...overrides}
});
test("positive share balance with both zero means report just zero direct limit, not lost funds",()=>{
 const x=zeroLimitContext(snapshot());
 assert.equal(x.status,"both_zero");
 assert.equal(x.sharesProvenPositive,true);
 assert.equal(x.notProtocolIdentification,true);
 assert.equal(x.notAnAudit,true);
 assert.equal(x.notOnchainLiquidityProof,true);
 assert.equal(x.automaticTransaction,false);
 assert.match(x.summary,/not proof that shares disappeared/);
 assert.match(x.summary,/has NOT identified your contract as Morpho Vault V2/);
 assert.match(x.summary,/cannot promise any redeemable assets/);
});
test("one zero asset limit while shares nonzero remains an explicit warning",()=>{
 assert.equal(zeroLimitContext(snapshot({maxRedeem:1n})).status,"withdraw_zero");
 assert.equal(zeroLimitContext(snapshot({maxWithdraw:1n})).status,"redeem_zero");
});
test("zero returns no conclusion about shares that have not been read or have zero balance",()=>{
 let x=zeroLimitContext(snapshot({balance:null}));
 assert.equal(x.sharesProvenPositive,false);
 x=zeroLimitContext(snapshot({balance:0n}));
 assert.equal(x.sharesProvenPositive,false);
 assert.equal(x.status,"both_zero");
});
test("unknown null is distinct from zero; avoid false status warnings",()=>{
 assert.equal(zeroLimitContext(snapshot({maxWithdraw:null,maxRedeem:null})),null);
 assert.equal(zeroLimitContext(snapshot({maxWithdraw:null,maxRedeem:1n})),null);
 assert.equal(zeroLimitContext(snapshot({maxWithdraw:1n,maxRedeem:2n})),null);
});
test("ownerless and malformed snapshots cannot imply any owner's exit ability",()=>{
 assert.equal(zeroLimitContext({...snapshot(),owner:null}),null);
 assert.equal(zeroLimitContext(null),null);
 assert.equal(zeroLimitContext({owner:snapshot().owner,limits:null}),null);
});
test("reference is only an official, direct Morpho link, not sales referral or paywalled source",()=>{
 assert.equal(MORPHO_V2_OFFICIAL_GUIDE,
 "https://github.com/morpho-org/morpho-snippets#vaultv2-liquidity-lib-alternative-view-for-maxwithdraw--maxredeem");
 const d=zeroLimitContext(snapshot());
 assert.equal(d.externalSource,MORPHO_V2_OFFICIAL_GUIDE);
 assert.match(d.sourceLabel,/Morpho's official/);
 assert(!d.externalSource.includes("clawlancer"));
});
test("limit context module does not query wallets, RPC, require network or sign",()=>{
 const code=fs.readFileSync(new URL("../src/zero-limit-context.mjs",import.meta.url),"utf8");
 for(const bad of [/fetch\s*\(/,/localStorage/,/eth_sendTransaction/,/eth_call/,/requestRedeem\s*\(/,/privateKey/,/window\.ethereum/])
  assert(!bad.test(code));
});
test("display integration must preserve existing raw metric labels and external source",()=>{
 const index=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const app=fs.readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
 assert.match(index,/id="zero-limit-context"/);
 assert.match(app,/zeroLimitContext\(snapshot\)/);
 assert.match(index,/Morpho's official Vault V2/);
 assert.match(app,/const context = zeroLimitContext/);
 assert.match(app,/context\.summary/);
 assert.match(app,/context\.externalSource/);
 assert.match(index,/rel="noopener noreferrer"/);
 assert.match(app,/maxWithdraw\(owner\)/);
 assert.match(app,/maxRedeem\(owner\)/);
});
test("link must only be visible with a real zero limit and owner, not from page load",()=>{
 const app=fs.readFileSync(new URL("../src/app.mjs",import.meta.url),"utf8");
 assert.match(app,/box\.hidden = !context/);
 assert.match(app,/if\(context\)/);
});

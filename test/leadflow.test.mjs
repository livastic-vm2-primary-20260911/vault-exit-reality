import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const home=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const contact=fs.readFileSync(new URL("../contact.html",import.meta.url),"utf8");
const thanks=fs.readFileSync(new URL("../thanks.html",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../contact.css",import.meta.url),"utf8");
const sitemap=fs.readFileSync(new URL("../sitemap.xml",import.meta.url),"utf8");
test("primary buyer CTA is a manual inquiry, not an unverified human marketplace checkout",()=>{
 assert.match(home,/href="\.\/contact\.html">Request a scoped quote — no login/);
 assert.match(home,/normal human buyer checkout there has NOT been verified/);
 assert(!/Order a scoped brief via USDC escrow/.test(home));
});
test("broken provider form is retired; site sends no automatic POST or personal data",()=>{
 assert.equal((contact.match(/<form /g)||[]).length,0);
 assert.match(contact,/form-action 'none'/);
 assert(!/<script/i.test(contact));
 assert(!/type="file"/i.test(contact));
 assert.match(contact,/external web-form delivery test failed/);
});
test("manual mail draft has visible owner email and requires user's own app action",()=>{
 assert.match(contact,/href="mailto:onecursor1@gmail\.com\?subject=/);
 assert.match(contact,/Open email draft \(no website login\)/);
 assert.match(contact,/nothing is uploaded or sent when you view this website/);
 assert.match(contact,/no charge occurs here/i);
});
test("optional scope excludes wallet ownership, private financial and identity records",()=>{
 assert.match(contact,/only your network/);
 assert.match(contact,/PUBLIC vault contract address/);
 assert.match(contact,/Please do not include your wallet balances/);
 assert.match(contact,/No payment, customer contract/);
});
test("no remote script, analytics, wallet signer or transfer operation in contact flow",()=>{
 for(const page of [home,contact,thanks]){
  assert(!/ethers\.js|walletconnect|web3modal|analytics\.js/i.test(page));
 }
 assert(!/<script/i.test(contact));
 assert(!/@import|fonts\.googleapis/.test(css));
});
test("quoted proposal and agent marketplace are correctly labelled, not cash",()=>{
 assert.match(contact,/19 native Circle Base USDC/);
 assert.match(contact,/written scope/);
 assert.match(contact,/human checkout not verified/);
 assert.match(contact,/no charge occurs here/i);
});
test("sitemap advertises free checker, real public sample, and manual human inquiry path",()=>{
 assert.equal((sitemap.match(/<url>/g)||[]).length,5);
 assert.match(sitemap,/\/vault-exit-reality\/contact\.html/);
});
test("legacy provider confirmation never claims a message, order or payment arrived",()=>{
 assert.match(thanks,/not mean a message reached us/);
 assert.match(thanks,/former external web form was disabled/);
 assert.match(thanks,/href="\.\/contact\.html"/);
});

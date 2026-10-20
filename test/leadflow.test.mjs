import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const home=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const contact=fs.readFileSync(new URL("../contact.html",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../contact.css",import.meta.url),"utf8");
const thanks=fs.readFileSync(new URL("../thanks.html",import.meta.url),"utf8");
const sitemap=fs.readFileSync(new URL("../sitemap.xml",import.meta.url),"utf8");
test("buyer-facing primary CTA is a no-login pre-sale inquiry, not unverified Clawlancer human checkout",()=>{
 assert.match(home,/href="\.\/contact\.html">Request a scoped quote — no login/);
 assert.match(home,/normal human buyer checkout there has NOT been verified/);
 assert(!/Order a scoped brief via USDC escrow/.test(home));
});
test("one sender-controlled POST form only to previously activated third-party FormSubmit",()=>{
 assert.equal((contact.match(/<form /g)||[]).length,1);
 assert.match(contact,/action="https:\/\/formsubmit\.co\/onecursor1@gmail\.com"/);
 assert.match(contact,/method="POST"/);
 assert.match(contact,/form-action https:\/\/formsubmit\.co/);
 assert.match(contact,/name="_captcha" value="true"/);
 assert(!/value="false"/.test(contact));
 assert(!/<script/i.test(contact));
 assert(!/type="file"/i.test(contact));
});
test("form consent is independently mandatory and visible",()=>{
 assert.match(contact,/<input id="consent"[^>]*type="checkbox"[^>]*required>/);
 assert.match(contact,/third-party FormSubmit/);
 assert.match(contact,/no payment or commitment occurs by completing this form/i);
 assert.match(contact,/FormSubmit/);
});
test("pre-sale intake requests only technical scope and voluntary contact",()=>{
 assert.match(contact,/name="email"/);
 assert.match(contact,/name="network"/);
 assert.match(contact,/name="public_vault_contract"/);
 assert.match(contact,/name="question" minlength="20" maxlength="600"/);
 assert(!/name="seed"/i.test(contact));
 assert(!/name="private_key"/i.test(contact));
 assert(!/name="balance"/i.test(contact));
 assert(!/name="transaction_signature"/i.test(contact));
});
test("contact sends no wallet approval, transaction, gas, or analytics script",()=>{
 for(const page of [contact,thanks]){
  assert(!/<script/i.test(page));
  assert(!/ethers\.js|walletconnect|metamask|web3modal|analytics/i.test(page));
 }
 assert(!/@import|https:\/\/fonts\.googleapis/.test(css));
 assert.match(contact,/No payment or commitment occurs by completing this form/);
});
test("contract quote and optional agent listing are distinguished",()=>{
 assert.match(contact,/19 native Circle Base USDC/);
 assert.match(contact,/written scope/);
 assert.match(contact,/human checkout not verified/);
 assert.match(contact,/No payment or commitment occurs by completing this form/);
});
test("canonical sitemap includes public no-login contact and free checker only",()=>{
 assert.match(sitemap,/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
 assert.match(sitemap,/\/vault-exit-reality\/contact\.html/);
 assert.match(sitemap,/\/vault-exit-reality\/<\/loc>/);
 assert.equal((sitemap.match(/<url>/g)||[]).length,2);
});
test("third-party redirect confirmation is not proof of user purchase or email delivery",()=>{
 assert.match(thanks,/does not independently verify email delivery/);
 assert.match(thanks,/no order, accepted customer engagement, deposit/i);
});

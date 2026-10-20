import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=new URL("../",import.meta.url);
const contact=fs.readFileSync(new URL("contact.html",root),"utf8");
const home=fs.readFileSync(new URL("index.html",root),"utf8");
const form="https://docs.google.com/forms/d/e/1FAIpQLSe_N8anCGUDmWdNZLnGwFRfhYaaCsB18BKdYd_VsFZp1xWm3g/viewform";
test("existing one-owner voluntary Form linked without requiring a mail client",()=>{
 assert(contact.includes('href="'+form+'"'));
 assert.match(contact,/Open voluntary quote request \(Google Forms\)/);
 assert.match(contact,/Vault Exit Reality — ERC-4626 technical brief/);
 assert.match(contact,/same one-owner VM5 sales desk/);
 assert.match(home,/separately hosted, voluntary Google Form/);
});
test("original mailto still works; no local web form, JS, or automated charge",()=>{
 assert.match(contact,/href="mailto:onecursor1@gmail\.com\?subject=/);
 assert.equal((contact.match(/<form\b/gi)||[]).length,0);
 assert(!/<script\b/i.test(contact));
 assert.match(contact,/form-action 'none'/);
 assert.match(contact,/This does not submit an order, approve payment/);
 assert.match(contact,/Viewing or opening this external form alone makes no payment/);
});
test("Google and privacy controls clearly disclosed",()=>{
 assert.match(contact,/reply email address/);
 assert.match(contact,/processed by Google and that desk/);
 assert.match(contact,/Google may offer sign-in to save progress/);
 assert.match(contact,/Never enter an owner\/controller wallet/);
 assert.match(contact,/real invoices, keys, seeds, signatures, identity files/);
 assert.match(contact,/one PUBLIC vault\/chain question/);
 assert.match(contact,/19 native Base Circle USDC/);
});
test("free scoped inquiry does not assert completed buyer payment or normal checkout",()=>{
 assert.match(contact,/no charge occurs here/i);
 assert.match(contact,/No payment, customer contract/);
 assert.match(contact,/human checkout not verified/);
 assert.match(home,/normal human buyer checkout there has NOT been verified/);
});
test("external link is isolated and preserves the no-Google fallback",()=>{
 assert(contact.includes('target="_blank" rel="noopener noreferrer">Open voluntary quote'));
 assert.match(contact,/If you prefer no Google form, use the manual email option/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const r = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path,r), "utf8");
const offer = JSON.parse(read("agents/offer.json"));
const doc = read("agents/index.html");
const skill = read("agents/SKILL.md");
const home = read("index.html");
const contact = read("contact.html");
const sitemap = read("sitemap.xml");

test("the public offer is a real original listed FIXED service, not a claimed bounty",()=>{
 assert.equal(offer.schema,"vault-exit-reality-public-offer-v1");
 assert.equal(offer.listing_id,"0531b48c-f126-451a-ab99-d34d0fd7408a");
 assert.equal(offer.original_seller_agent_id,"f3804c61-18ed-4c51-863d-97e7f3d35371");
 assert.equal(offer.advertised_listing_type,"FIXED");
 assert.equal(offer.was_listed_active_when_observed,true);
 assert.equal(offer.beneficial_owner_count,1);
 assert(!Number.isNaN(Date.parse(offer.observed_at_utc)));
});
test("USDC price uses canonical Base chain and correct six-decimal atomic units",()=>{
 assert.equal(offer.pay_currency,"USDC");
 assert.equal(offer.pay_network,"eip155:8453");
 assert.equal(offer.asset.toLowerCase(),"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");
 assert.equal(offer.price_atomic_on_observed_listing,"19000000");
 assert.equal(offer.currency_decimals,6);
 assert.equal(offer.price_usdc_on_observed_listing,"19.000000");
 assert.equal(BigInt(offer.price_atomic_on_observed_listing),19000000n);
});
test("no autonomous spending, wallet login, private inputs or fake cash is authorized",()=>{
 assert.equal(offer.buyer_explicit_approval_before_any_payment_required,true);
 assert.equal(offer.buyer_key_seed_ever_requested,false);
 assert.equal(offer.buyer_sensitive_customer_data_accepted,false);
 assert.equal(offer.human_web_checkout_proven,false);
 assert.equal(offer.seller_income_from_listing_activity_alone,"0");
 assert.equal(offer.ai_assistance_disclosed,true);
 assert.equal(offer.acceptance_and_refunds.includes("before funded order"),true);
});
test("the public guide points to exact read-only official seller listing and vendor buy docs",()=>{
 assert.equal(offer.source_of_truth,"https://clawlancer.ai/api/listings/0531b48c-f126-451a-ab99-d34d0fd7408a");
 assert.equal(offer.official_marketplace_api_docs,"https://clawlancer.ai/api-docs");
 assert.equal(offer.authenticated_agent_fixed_buy_route_documented,"/api/listings/{id}/buy");
 assert.match(skill,/Original seller agent ID/);
 assert.match(skill,/Clawlancer/);
 assert.match(doc,/POST \/api\/listings\/\{id\}\/buy/);
 assert.match(doc,/current public listing JSON/);
});
test("fixed purchase and bounty claim actions are explicitly distinguished",()=>{
 assert.match(skill,/BOUNTY claim method MUST NOT be used for this FIXED service/);
 assert.match(doc,/never use a BOUNTY claim route/);
 assert.match(doc,/generic marketplace human screen can incorrectly look like a bounty/i);
 assert.match(skill,/A generic human UI that says "Open for claims"/);
});
test("the buyer only supplies independently authorized public scope and pricing",()=>{
 assert.match(skill,/independent buyer/i); // independent person controls the fund source
 assert.match(skill,/explicit buyer authorization/i);
 assert.match(skill,/cancellation\/refund/);
 assert.match(doc,/written scope/);
 assert.match(doc,/buyer.*approve/i);
 assert.match(doc,/Never send money directly/);
});
test("the static HTML requests zero network reads, wallet approvals or user data uploads",()=>{
 assert.match(doc,/script-src 'none'/);
 assert.match(doc,/connect-src 'none'/);
 assert.match(doc,/form-action 'none'/);
 assert.equal((doc.match(/<form\b/g)||[]).length,0);
 assert.equal((doc.match(/<script\b/g)||[]).length,0);
 assert(!/window\.ethereum|wallet\.connect|personal_sign|eth_sendTransaction/i.test(doc));
});
test("owner-specific contract values and ERC7540 request caveats remain honest",()=>{
 assert.equal(offer.free_services.length,3);
 assert(offer.free_services.every(s=>s.startsWith("https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/")));
 assert.match(skill,/raw shares/i);
 assert.match(skill,/not withdrawable funds/i);
 assert.match(skill,/withdrawal/);
 assert.match(doc,/solvency/i);
});
test("agent-readable Markdown is only public documentation, not a private tooling capability",()=>{
 assert.match(skill,/documentation only/);
 assert.match(skill,/never authorizes paying/);
 assert(!/api_key=|private_key=|mnemonic=/.test(skill));
 assert(!/Bearer [A-Za-z0-9_-]{12,}/.test(skill));
 assert(!/sendRawTransaction|transferFrom\s*\(/.test(skill));
});
test("site navigation exposes a legitimate original buyer path and free alternatives",()=>{
 assert.match(home,/href="\.\/agents\/"/);
 assert.match(contact,/href="\.\/agents\/"/);
 assert.match(doc,/href="\.\/offer\.json"/);
 assert.match(doc,/href="\.\/SKILL\.md"/);
 assert.match(doc,/href="\.\.\/sample-brief\/"/);
 assert.match(doc,/href="\.\.\/sample-async\/"/);
});
test("all indexed URLs are from one real GitHub Pages owner only",()=>{
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(urls.length,5);
 assert(urls.every(u=>u.startsWith("https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/")));
 assert(urls.some(u=>u.endsWith("/agents/")));
});
test("a price and a static listing snapshot are never presented as booked paid revenue",()=>{
 assert.match(offer.disclaimer,/not a binding offer/);
 assert.match(offer.disclaimer,/earnings evidence/);
 assert.match(doc,/not income/i);
 assert.match(skill,/does not equal a funded order/);
 assert.match(doc,/Never send money directly/);
});

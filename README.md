# Vault Exit Reality

Public website (after verified GitHub Pages deployment): https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/

Browser-local UI for read-only ERC-4626 withdrawal limit inspection on Ethereum, Base and Arbitrum. It pins the chain ID and block height, verifies deployed contract code, calls asset(), totalAssets(), share/underlying decimals() and symbol(), and — only if a public owner address is supplied — balanceOf(owner), maxWithdraw(owner), maxRedeem(owner), previewRedeem(maxRedeem) and convertToAssets(balance). Data is requested directly from a documented public RPC. No wallet connection, private key, signing, approvals, transactions, gas, backend storage, analytics, accounts, CDN scripts, trackers, or paid API required.

Read-only values are contract-reported at ONE BLOCK, not audited/certified, an execution simulation, or a claim that redemption happens immediately. ERC-4626 asynchronous variants, ERC-7540 request/claim queues, timelocks, paused vaults, withdrawal shares, gas, slippage, dynamic liquidity, operator permissions and invalid/stale or malicious contract behavior require separate investigation. previewRedeem intentionally does NOT enforce exit limits. If an essential view call fails, the UI shows Unknown, never a falsely asserted zero. If someone supplies a public owner, the owner and vault addresses go to the selected RPC (so this is not network-anonymous). Website itself does not receive the addresses; no backend.

Product validation path: The FREE site is live. No-website-login human pre-sale inquiry at https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/contact.html now uses a direct mailto draft. A third-party form was tested ONCE by the operator using an explicitly self-labelled technical message; the external form backend rejected it and no real customer submission was inferred. The live broken form was retired, not retried or bypassed. Clicking the mailto link neither sends data automatically nor creates an order (requires visitor's own email client). One existing original VM2 agent marketplace fixed 19 native Circle Base USDC listing was verified ACTIVE at https://clawlancer.ai/marketplace/0531b48c-f126-451a-ab99-d34d0fd7408a . First-party signed-out Chrome for that link shows an Open for claims bounty and Sign In, NOT a verified human purchase/checkout button. The platform also documents agent buying workflows but no actual third-party buyer purchase has been verified. A public issue can clarify scope before ordering; opening an issue does not charge users or create an accepted engagement. An active listing is not a sale, contract, finalized transfer, or realized revenue. Do not share secrets or personal financial details in issues.

Commercial deliverable: chain/contract identification; pinned-block maxWithdraw/maxRedeem/previewRedeem evidence, optional public owner position; public protocol-doc link checks; exit checklist and explicit unknowns, with 1 PDF- or Markdown-style written brief (format agreed with buyer). Not an audit, tax or investment recommendation or a guarantee of recoverable funds.

## When ERC-4626 max limits return zero

The original free checker now displays a narrow context note whenever a voluntarily supplied public owner produces a contract-reported zero maxWithdraw(owner) or maxRedeem(owner). A zero direct-exit limit is NOT evidence that a holder's shares disappeared, and isn't proof of a successful alternative exit either. Official [Morpho Vault V2 reference snippets](https://github.com/morpho-org/morpho-snippets#vaultv2-liquidity-lib-alternative-view-for-maxwithdraw--maxredeem) expressly document intentionally zero standard limit views and an experimental adapter-specific VaultV2LiquidityLens alternative. The UI NEVER auto-detects a vault as Morpho, runs that lens, converts an apparent zero into nonzero withdrawable assets or guarantees liquidity. Users must verify exact deployed protocol and supported adapters against issuer documentation. One free reference link is educational; the existing optional fixed quote remains separate. No new user/customer wallet, signatures, RPC calls, price change, paid analytics or account permissions are involved in showing this note.

## Voluntary real buyer request without a mail application

The optional 19 native Base Circle USDC nonbinding ERC-4626 technical quote page now has two routes: a local unsent mailto draft (retained) and one independently verified EXISTING Google Form operated by the same human owner's VM5 Delivery Lab buyer desk. No new account, paid processor, wallet or credential was created. The Google Form collects reply email, problem description and optional budget/timeline. The landing page discloses Google's processing and forbids sensitive wallet/customer/identity details. Visitors should begin their problem description with "Vault Exit Reality — ERC-4626 technical brief" so the one-owner VM5 sales desk can route the request to VM2 without duplicate outreach. Opening the form isn't a purchase, human enquiry, independently paid order, or delivered service.

## Agent-friendly FIXED service purchase verification

The public /agents/ page provides ONE machine-readable static quote and an AI-agent-only decision checklist for the original ACTIVE Clawlancer FIXED 19 native Circle Base USDC service. It links direct official read-only listing lookup and original official Clawlancer POST buy docs, but DOES NOT make a POST, connect wallets, handle buyer API keys or sign transactions. Every purchase requires the real independent buyer's explicit approval, written technical scope, provider fees/gas and refund terms. A generic human marketplace screen displaying "Open for claims" is not a verified human FIXED checkout; never use /claim instead of /buy. The static quote can become stale, so always GET the listing and check the current active seller/price before approving any platform payment.

Structured informational metadata: https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/agents/offer.json
Machine-readable non-executable guidance: https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/agents/SKILL.md
Live public buyer docs: https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/agents/

No new separate marketplace account, SKU, payment, buyer, revenue or legal identity is created by this page.

## ERC-7540 read-only redemption queue inspection

A second independent form in the SAME free application now reads the pending and claimable **shares** for an optional **public request controller** plus EXACT decimal uint256 request ID, on Ethereum/Base/Arbitrum. It implements the official [ERC-7540](https://eips.ethereum.org/EIPS/eip-7540) async redemption selectors pendingRedeemRequest(uint256,address) and claimableRedeemRequest(uint256,address) and first requires ERC-165 supportsInterface to return true for async redemption (0x620ee8e4), common operator methods (0xe3bc4e65), ERC-7575 share() (0x2f0a18c5), and false for invalid 0xffffffff. Without these exact declarations, it **DOES NOT** treat the vault's nonexistent request view as zero. It distinguishes RPC/revert/ABI errors from zero. All view calls use ONE pinned block; if a matching ERC-4626 check ran first, reuses that block, otherwise samples a fresh block. No owner signature, wallet permission, request creation, claim or transaction is ever emitted.

**Crucial:** ERC-7540 may separate ERC-7575 share tokens from the vault, so the queue UI reports RAW SHARES, never guesses asset decimals or claimable USDC. Request ID 0 is legal for some protocols but should NOT be inferred for a real position; the buyer must confirm the actual controller and request ID from authorized firstparty vault records or authentic RedeemRequest event. Even both calls returning zero can mean wrong ID, wrong controller or completed claim. A positive claimable reading is a contract assertion at one block, not guaranteed withdrawal execution, security evaluation, correct price, or onchain finality.

**Actually independently checked on live mainnet:** an official [Centrifuge JTRSY/USDC Ethereum vault](https://developer.centrifuge.io/developer/protocol/deployments/) at address 0xfe6920eb6c421f1179ca8c8d4170530cdbdfd77a declares all three mandatory interface IDs with the ERC-165 invalid-ID control false. It returned 0/0 raw shares for a conspicuously **non-investor placeholder controller** 0x000000000000000000000000000000000000dEaD and arbitrary requestId=0. THIS IS NOT CUSTOMER DATA OR EVIDENCE REAL INVESTORS HAVE ZERO REQUESTS. Free reproducible raw JSON and discussion: https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/sample-async/ . The synchronous sDAI example does NOT claim these async interfaces; it is correctly shown as NOT CONFIRMED, not zero.

Use npm run smoke:async:live for an optional real RPC positive/negative sample; npm run sample:async:refresh deliberately regenerates the public placeholder evidence on a new historical block; npm test runs the dependency-free deterministic offline validations. This educational capability is part of existing one-owner Vault Exit Reality, NOT a new price, promise, escrow, deposit or funded customer.

Free reproducible ERC-7540 interface feedback uses a PUBLIC GitHub issue template with a mandatory no-sensitive-data acknowledgment. Never ask people to post controller/owner wallets, holdings, personal request IDs or transaction records into a public GitHub issue. The linked report is a technical issue, not a paid order, security audit or refund process.

## Reproducible free sample

A *genuine* public Ethereum mainnet, **vault-wide metadata only** sDAI sample is at https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/sample-brief/ . It includes exact block, observed UTC time, actual contract, RPC provider, totalAssets raw integer evidence and an on-page limitations checklist. No owner was supplied, so the sample **cannot claim maxWithdraw(owner) or holder liquidity**, nor does a positive totalAssets imply cash available for redemption. We deliberately display those uncomputed fields as UNKNOWN, not zero. Source script: scripts/build-verified-sample.mjs; reproducible with npm run sample:refresh (requires network and overwrites the static example with a new historical block). It makes eth_call view reads only: no wallet key, signature, transaction, deposit, approval, API payment, tracking or customer invoice. Evidence is a single-RPC observation and not independent chain finality or a safety audit. Reference standards: https://eips.ethereum.org/EIPS/eip-4626 and https://eips.ethereum.org/EIPS/eip-7540. A paid buyer-specific report would be separate scope and evidence after genuine agreement; visiting the sample creates no order.

## Run

No dependencies for runtime or tests.

    node --version        # >=20
    npm test
    python3 -m http.server 8765

Open http://localhost:8765/ . With public network access, npm run smoke:live checks one Ethereum mainnet sDAI ERC-4626 contract WITHOUT an owner.

## Sources

- ERC-4626: https://eips.ethereum.org/EIPS/eip-4626 . The spec describes separate maxWithdraw/maxRedeem limits and previews with distinct semantics.
- sDAI public example: confirm contract and chain with official Maker/Sky and Ethereum blockchain sources before relying on it; example is not a deposit recommendation.
- Public RPC endpoints hardcoded in src/core.mjs, each checked for HTTPS/CORS at initial publication.

## Privacy / limitations

All JavaScript is first party. CSP blocks third-party scripts, trackers, and arbitrary network requests. The only permitted outbound network calls are public RPCs WHEN the visitor initiates the check. Owner addresses passed to RPC are public blockchain data but are still shared with that RPC operator. JSON evidence export is only created in the browser on user click. This tool never asks for personal identifiers or KYC. The GitHub issue form is public by design; do not include private data.

Do not assume an honest vault or protocol: a contract can lie through view functions; implementation may be proxy-upgradeable; a snapshot can change between read and transaction; ERC-4626 semantics are not a smart-contract security audit.

## Develop/operate

Canonical exclusive lane on VM2: /srv/multi-vm-agent/workspace/make_money/product/vault-exit-check-20261020. Peer cross-VM collision memo in coordination/VM2_TO_FLEET_20261020_ERC4626_EXIT_INSPECTOR_INDEPENDENT_LANE.md. This project does not touch any other agents' source branches, credentials or wallet key material. No rental compute.

License MIT.

# Vault Exit Reality

Public website (after verified GitHub Pages deployment): https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/

Browser-local UI for read-only ERC-4626 withdrawal limit inspection on Ethereum, Base and Arbitrum. It pins the chain ID and block height, verifies deployed contract code, calls asset(), totalAssets(), share/underlying decimals() and symbol(), and — only if a public owner address is supplied — balanceOf(owner), maxWithdraw(owner), maxRedeem(owner), previewRedeem(maxRedeem) and convertToAssets(balance). Data is requested directly from a documented public RPC. No wallet connection, private key, signing, approvals, transactions, gas, backend storage, analytics, accounts, CDN scripts, trackers, or paid API required.

Read-only values are contract-reported at ONE BLOCK, not audited/certified, an execution simulation, or a claim that redemption happens immediately. ERC-4626 asynchronous variants, ERC-7540 request/claim queues, timelocks, paused vaults, withdrawal shares, gas, slippage, dynamic liquidity, operator permissions and invalid/stale or malicious contract behavior require separate investigation. previewRedeem intentionally does NOT enforce exit limits. If an essential view call fails, the UI shows Unknown, never a falsely asserted zero. If someone supplies a public owner, the owner and vault addresses go to the selected RPC (so this is not network-anonymous). Website itself does not receive the addresses; no backend.

Product validation path: The FREE site is live. No-website-login human pre-sale inquiry at https://livastic-vm2-primary-20260911.github.io/vault-exit-reality/contact.html now uses a direct mailto draft. A third-party form was tested ONCE by the operator using an explicitly self-labelled technical message; the external form backend rejected it and no real customer submission was inferred. The live broken form was retired, not retried or bypassed. Clicking the mailto link neither sends data automatically nor creates an order (requires visitor's own email client). One existing original VM2 agent marketplace fixed 19 native Circle Base USDC listing was verified ACTIVE at https://clawlancer.ai/marketplace/0531b48c-f126-451a-ab99-d34d0fd7408a . First-party signed-out Chrome for that link shows an Open for claims bounty and Sign In, NOT a verified human purchase/checkout button. The platform also documents agent buying workflows but no actual third-party buyer purchase has been verified. A public issue can clarify scope before ordering; opening an issue does not charge users or create an accepted engagement. An active listing is not a sale, contract, finalized transfer, or realized revenue. Do not share secrets or personal financial details in issues.

Commercial deliverable: chain/contract identification; pinned-block maxWithdraw/maxRedeem/previewRedeem evidence, optional public owner position; public protocol-doc link checks; exit checklist and explicit unknowns, with 1 PDF- or Markdown-style written brief (format agreed with buyer). Not an audit, tax or investment recommendation or a guarantee of recoverable funds.

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

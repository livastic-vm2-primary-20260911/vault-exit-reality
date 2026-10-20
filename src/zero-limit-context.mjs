/**
 * Narrow explanatory UX for ERC-4626 zero limits.
 * In particular, Morpho Vault V2 intentionally returns zero for the default
 * max* methods. See the *official* Morpho snippets:
 * https://github.com/morpho-org/morpho-snippets#vaultv2-liquidity-lib-alternative-view-for-maxwithdraw--maxredeem
 * Do not interpret zero as a wallet losing money or as a cryptographic proof
 * that the request can succeed via an alternate adapter.
 */
export const MORPHO_V2_OFFICIAL_GUIDE =
  "https://github.com/morpho-org/morpho-snippets#vaultv2-liquidity-lib-alternative-view-for-maxwithdraw--maxredeem";

export function zeroLimitContext(snapshot) {
  if (!snapshot || !snapshot.owner || !snapshot.limits) return null;
  const {maxWithdraw,maxRedeem,balance} = snapshot.limits;
  if (maxWithdraw !== 0n && maxRedeem !== 0n) return null;
  if (maxWithdraw === null && maxRedeem === null) return null;
  const status = maxWithdraw === 0n && maxRedeem === 0n ? "both_zero" :
    maxWithdraw === 0n ? "withdraw_zero" : "redeem_zero";
  const sharesProvenPositive = typeof balance === "bigint" && balance > 0n;
  const summary = "A zero maxWithdraw/maxRedeem is a reported synchronous exit limit, not proof that shares disappeared or are redeemable by an alternative route. Morpho Vault V2 is a documented example where both default views intentionally return zero. This checker has NOT identified your contract as Morpho Vault V2, has NOT run Morpho's optional liquidity lens, and cannot promise any redeemable assets. Verify the exact protocol, adapter support, liquidity restrictions and official docs before taking action.";
  return {
    status,
    sharesProvenPositive,
    summary,
    externalSource:MORPHO_V2_OFFICIAL_GUIDE,
    sourceLabel:"Morpho's official Vault V2 liquidity-lens documentation",
    label:"Interpreting zero withdrawal-limit views",
    notAnAudit:true,
    notOnchainLiquidityProof:true,
    notProtocolIdentification:true,
    automaticTransaction:false
  };
}

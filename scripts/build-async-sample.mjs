#!/usr/bin/env node
// Re-check a real public ERC-7540 interface. Placeholder controller is NOT
// an actual investor or authenticated redemption request. Read-only RPC only.
import fs from "node:fs";
import {inspectAsyncRedeem, serializeAsyncEvidence} from "../src/async-redeem.mjs";
const vault="0xfe6920eb6c421f1179ca8c8d4170530cdbdfd77a";
const placeholder="0x000000000000000000000000000000000000dEaD";
const response=await inspectAsyncRedeem({
  chain:"ethereum",vault,controller:placeholder,requestId:"0"
});
if (response.chainId!==1 || response.interfaceState!=="DECLARED_ASYNC_REDEEM" ||
    response.warnings.length || response.pendingShares===null ||
    response.claimableShares===null ||
    response.erc165Probes["0xffffffff"]!==false ||
    response.erc165Probes["0x620ee8e4"]!==true ||
    response.erc165Probes["0xe3bc4e65"]!==true ||
    response.erc165Probes["0x2f0a18c5"]!==true) {
  throw Error("Cannot confirm official ERC-7540 interface at this block; refusing to publish.");
}
const evidence={
  ...serializeAsyncEvidence(response),
  inspectedAtUtc:new Date().toISOString(),
  evidenceKind:"REAL_ETHEREUM_MAINNET_ERC7540_WITH_NONINVESTOR_PLACEHOLDER",
  officialVaultRegistry:"https://developer.centrifuge.io/developer/protocol/deployments/",
  officialSpec:"https://eips.ethereum.org/EIPS/eip-7540",
  officialRegistryAsset:"JTRSY - USDC (Centrifuge)",
  controllerIsOnlyPublicPlaceholder:true,
  controllerKnownToHaveRealRequest:false,
  requestIdIsAnAuthenticatedInvestorRequest:false,
  noRealInvestorBalanceOrRedemptionDemonstrated:true,
  warningText:"A returned zero for dummy controller 0x...dEaD and request ID 0 cannot establish anything about real investor requests. Views are raw shares, not guaranteed withdrawable assets. One RPC is not a contract audit, finality certificate, or purchase receipt.",
  newIndependentUserPaidUSDC:"0.000000"
};
fs.mkdirSync(new URL("../sample-async/",import.meta.url),{recursive:true});
fs.writeFileSync(new URL("../sample-async/centrifuge-jtrsy-ethereum-erc7540-evidence.json",import.meta.url),
  JSON.stringify(evidence,null,2)+"\n");
console.log(JSON.stringify({
  onchainMainnet:true,block:evidence.blockNumber,erc7540:evidence.interfaceState,
  pendingForPublicPlaceholder:evidence.pendingRedeemSharesRaw,
  claimableForPublicPlaceholder:evidence.claimableRedeemSharesRaw,
  noActualInvestorDemonstrated:true,
  inspectedAtUtc:evidence.inspectedAtUtc
}));

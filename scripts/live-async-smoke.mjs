// Optional NETWORK-dependent reproducible read-only smoke tests.
// Real mainnet contract addresses from Centrifuge docs and sDAI.
import {inspectAsyncRedeem} from "../src/async-redeem.mjs";
const placeholder="0x000000000000000000000000000000000000dEaD";
const tests=[
  {name:"Centrifuge-JTRSY-Ethereum-USDC",vault:"0xfe6920eb6c421f1179ca8c8d4170530cdbdfd77a",expected:"DECLARED_ASYNC_REDEEM"},
  {name:"sDAI-sync-example-not-7540",vault:"0x83F20F44975D03b1b09e64809B757c47f942BEeA",expected:"NOT_CONFIRMED"}
];
for(const t of tests){
  const s=await inspectAsyncRedeem({chain:"ethereum",vault:t.vault,controller:placeholder,requestId:"0"});
  if(s.interfaceState!==t.expected)throw Error(t.name+" unexpected ERC-7540 support claim: "+s.interfaceState);
  if(t.expected!=="DECLARED_ASYNC_REDEEM" &&
      (s.pendingShares!==null||s.claimableShares!==null))
    throw Error(t.name+" invented queue values on unsupported vault.");
  if(t.expected==="DECLARED_ASYNC_REDEEM" &&
      (s.pendingShares===null||s.claimableShares===null))
    throw Error(t.name+" cannot decode pending and claimable shares.");
  console.log(JSON.stringify({
    name:t.name,network:s.chain,block:s.blockNumber.toString(),
    declared:s.interfaceState,pendingForPublicNonInvestor:s.pendingShares?.toString()??null,
    claimableForPublicNonInvestor:s.claimableShares?.toString()??null,
    noWalletUsed:true,noAssetsTransacted:true,anyRealInvestorVerified:false,
    zeroForPlaceholderIsNotUserLiquidity:true
  }));
}

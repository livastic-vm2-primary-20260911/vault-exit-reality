import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  parseRequestId, interfaceCalldata, redeemRequestCalldata, explainAsyncState,
  inspectAsyncRedeem, serializeAsyncEvidence, ASYNC_REDEEM_SELECTORS,
  REQUIRED_7540_INTERFACES
} from "../src/async-redeem.mjs";
const V = "0x83F20F44975D03b1b09e64809B757c47f942BEeA";
const C = "0x000000000000000000000000000000000000dEaD";
const word = n => "0x" + BigInt(n).toString(16).padStart(64, "0");
function mock({ifaceFalse=false,malformedInterface=false,invalidInterfaceTrue=false,
  pending=4000000000000000000n,claimable=2000000000000000000n,
  badMethod="",noCode=false,chainMismatch=false,calls=[]}={}) {
  return async (_url, method, params=[]) => {
    calls.push([method,params]);
    if(method === "eth_chainId") return chainMismatch ? "0x2105" : "0x1";
    if(method === "eth_blockNumber") return "0xcafe";
    if(method === "eth_getCode") return noCode ? "0x" : "0x60026001";
    assert.equal(method,"eth_call");
    const [{to,data},block] = params;
    assert.equal(to,V);
    assert.equal(block,"0xcafe","All eth_call must be pinned, never latest");
    const selector=data.slice(0,10);
    if(selector === ASYNC_REDEEM_SELECTORS.supportsInterface) {
      const iface="0x"+data.slice(10,18);
      if(malformedInterface && iface===REQUIRED_7540_INTERFACES[1]) return "0x";
      if(iface==="0xffffffff")return word(invalidInterfaceTrue ? 1n : 0n);
      return word(ifaceFalse ? 0n : 1n);
    }
    if(selector===ASYNC_REDEEM_SELECTORS.pendingRedeemRequest) {
      if(badMethod==="pending")throw Error("JSON RPC reverted");
      return word(pending);
    }
    if(selector===ASYNC_REDEEM_SELECTORS.claimableRedeemRequest) {
      if(badMethod==="claimable")return "0x";
      return word(claimable);
    }
    throw Error("Unexpected method selector: "+selector);
  };
}
test("ABI selectors are standard ERC165/7540 and interface IDs are official EIP",()=>{
  assert.equal(ASYNC_REDEEM_SELECTORS.supportsInterface,"0x01ffc9a7");
  assert.equal(ASYNC_REDEEM_SELECTORS.pendingRedeemRequest,"0xf5a23d8d");
  assert.equal(ASYNC_REDEEM_SELECTORS.claimableRedeemRequest,"0xeaed1d07");
  assert.deepEqual(REQUIRED_7540_INTERFACES,["0x620ee8e4","0xe3bc4e65","0x2f0a18c5"]);
});
test("strict decimal uint256 request IDs: no floats, negative, hex, leading zeros, exponent",()=>{
  assert.equal(parseRequestId("0"),0n);
  assert.equal(parseRequestId("42"),42n);
  assert.equal(parseRequestId(((1n<<256n)-1n).toString()),(1n<<256n)-1n);
  for(const x of ["", "00", "0012", "-1", "+1","0x7","3.3","1e6"," 1","1 ","１２","NaN","Infinity",42,(1n<<256n).toString()])
    assert.throws(()=>parseRequestId(x));
});
test("ABI calldata left-pads uint256 then address, correct length exactly",()=>{
  assert.equal(interfaceCalldata("0x620ee8e4"),"0x01ffc9a7"+"620ee8e4".padEnd(64,"0"));
  assert.equal(interfaceCalldata("0x620ee8e4").length,74);
  const d=redeemRequestCalldata("pendingRedeemRequest",1n,C);
  assert.equal(d.slice(0,10),"0xf5a23d8d");
  assert.equal(d.length,138);
  assert.equal(d.slice(10,74),"0".repeat(63)+"1");
  assert.equal(d.slice(74),"0".repeat(24)+C.slice(2).toLowerCase());
  assert.throws(()=>redeemRequestCalldata("requestRedeem",0n,C));
  assert.throws(()=>interfaceCalldata("nope"));
});
test("positive 7540 interface claims and both share amounts are returned, never assets",async()=>{
  const s=await inspectAsyncRedeem({vault:V,controller:C,requestId:"1",call:mock()});
  assert.equal(s.chainId,1);
  assert.equal(s.requestId,"1");
  assert.equal(s.blockNumber,0xcafen);
  assert.equal(s.interfaceState,"DECLARED_ASYNC_REDEEM");
  assert.equal(s.pendingShares,4n*10n**18n);
  assert.equal(s.claimableShares,2n*10n**18n);
  assert.equal(s.warnings.length,0);
  assert.match(s.explanation,/both pending and claimable shares/);
  assert.equal(s.erc165Probes["0xffffffff"],false);
});
test("request ID zero is valid and is NOT inferred to be a real request",async()=>{
  const s=await inspectAsyncRedeem({vault:V,controller:C,requestId:"0",call:mock({pending:0n,claimable:0n})});
  assert.equal(s.requestId,"0");
  assert.equal(s.pendingShares,0n);
  assert.equal(s.claimableShares,0n);
  assert.match(s.explanation,/never requested, wrong controller\/ID, already claimed/);
  assert.doesNotMatch(s.explanation,/guaranteed/i);
});
test("pending and claimable individually represented as shares and guarded explanation",async()=>{
  const p=await inspectAsyncRedeem({vault:V,controller:C,call:mock({pending:1n,claimable:0n})});
  assert.match(p.explanation,/pending redemption shares/);
  const c=await inspectAsyncRedeem({vault:V,controller:C,call:mock({pending:0n,claimable:1n})});
  assert.match(c.explanation,/Claiming still requires a separate authorized transaction/);
});
test("explicit ERC165 async false skips request views and shows UNKNOWN not zeros",async()=>{
  const calls=[];
  const s=await inspectAsyncRedeem({vault:V,controller:C,call:mock({ifaceFalse:true,calls})});
  assert.equal(s.interfaceState,"REDEEM_INTERFACE_FALSE");
  assert.equal(s.pendingShares,null);
  assert.equal(s.claimableShares,null);
  assert.match(s.explanation,/NOT verified/);
  assert.equal(calls.filter(x=>x[0]==="eth_call").length,4);
});
test("malformed ERC165 provider return cannot imply ERC7540 support",async()=>{
  const calls=[];
  const s=await inspectAsyncRedeem({vault:V,controller:C,call:mock({malformedInterface:true,calls})});
  assert.equal(s.interfaceState,"NOT_CONFIRMED");
  assert.equal(s.pendingShares,null);
  assert.equal(s.claimableShares,null);
  assert(s.warnings.some(w=>w.includes("supportsInterface(0xe3bc4e65)")));
  assert.equal(calls.filter(x=>x[0]==="eth_call").length,4);
});
test("contract returning true for invalid ERC165 0xffffffff is not trusted",async()=>{
  const calls=[];
  const s=await inspectAsyncRedeem({vault:V,controller:C,call:mock({invalidInterfaceTrue:true,calls})});
  assert.equal(s.interfaceState,"NOT_CONFIRMED");
  assert.equal(s.pendingShares,null);
  assert.equal(s.claimableShares,null);
  assert.equal(calls.filter(x=>x[0]==="eth_call").length,4);
});
test("failure on one supported method is explicitly UNKNOWN and cannot become zero",async()=>{
  const s=await inspectAsyncRedeem({vault:V,controller:C,call:mock({badMethod:"claimable"})});
  assert.equal(s.interfaceState,"DECLARED_ASYNC_REDEEM");
  assert.equal(s.claimableShares,null);
  assert.equal(s.pendingShares,4n*10n**18n);
  assert.match(s.explanation,/Status UNKNOWN/);
  assert(s.warnings.some(w=>w.includes("claimableRedeemRequest")));
});
test("RPC network mismatch stops before probing view methods",async()=>{
  const calls=[];
  await assert.rejects(inspectAsyncRedeem({vault:V,controller:C,call:mock({chainMismatch:true,calls})}),/chain mismatch/);
  assert.deepEqual(calls.map(x=>x[0]),["eth_chainId"]);
});
test("invalid vault/controller address rejects before any remote read",async()=>{
  const calls=[]; const fake=mock({calls});
  await assert.rejects(inspectAsyncRedeem({vault:"0x123",controller:C,call:fake}),/Address/);
  await assert.rejects(inspectAsyncRedeem({vault:V,controller:"0x"+"0".repeat(40),call:fake}),/Zero address/);
  assert.equal(calls.length,0);
});
test("zero contract code fails closed, not reported zero queue",async()=>{
  const calls=[];
  await assert.rejects(inspectAsyncRedeem({vault:V,controller:C,call:mock({noCode:true,calls})}),/No deployed/);
  assert.equal(calls.some(x=>x[0]==="eth_call"),false);
});
test("caller pinned block reused; no latest-block read, no inconsistent snapshot",async()=>{
  const calls=[];
  const s=await inspectAsyncRedeem({vault:V,controller:C,requestId:"12",blockTag:"0xcafe",call:mock({calls})});
  assert.equal(s.block,"0xcafe");
  assert.equal(calls.some(x=>x[0]==="eth_blockNumber"),false);
  assert(calls.filter(x=>x[0]==="eth_call").every(x=>x[1][1]==="0xcafe"));
});
test("precise evidence JSON exports uints as strings, distinguishes raw shares vs assets",async()=>{
  const s=await inspectAsyncRedeem({vault:V,controller:C,requestId:"2",call:mock()});
  const j=serializeAsyncEvidence(s);
  assert.equal(j.pendingRedeemSharesRaw,"4000000000000000000");
  assert.equal(j.claimableRedeemSharesRaw,"2000000000000000000");
  assert.equal(j.actualClaimExecutionVerified,false);
  assert.equal(j.walletSigned,false);
  assert.equal(j.externalPaymentMade,false);
  assert.equal(j.actualAssetsRedeemableNotGuaranteed,true);
  assert.equal(j.requestId,"2");
  assert.equal(j.blockNumber,"51966");
  assert(!JSON.stringify(j).includes("privateKey"));
  assert(!Object.keys(j).some(k=>k.includes("AssetsRaw")));
});
test("read-only module has no signing, wallet transaction or arbitrary RPC host strings",()=>{
  const src=fs.readFileSync(new URL("../src/async-redeem.mjs",import.meta.url),"utf8");
  for(const bad of [/fetch\s*\(/,/eth_sendRawTransaction/,/eth_sendTransaction/,/personal_sign/,/wallet_connect/,/localStorage/,/setOperator\s*\(/,/requestRedeem\s*\(/])
    assert(!bad.test(src),"Unsafe method found: "+bad);
});

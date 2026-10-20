import test from "node:test";
import assert from "node:assert/strict";
import {CHAINS,SELECTORS,requireAddress,encodeAddress,encodeUint256,decodeUint,decodeAddress,decodeString,formatUnits,describePosition,inspectVault,serializeSnapshot} from "../src/core.mjs";
const V = "0x83F20F44975D03b1b09e64809B757c47f942BEeA";
const O = "0x000000000000000000000000000000000000dEaD";
const A = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const w = (v) => BigInt(v).toString(16).padStart(64,"0");
const encAddr = (a) => "0x" + w(BigInt(a));
const encString = (s) => {
  const ascii = Buffer.from(s).toString("hex");
  return "0x" + w(32n) + w(BigInt(ascii.length/2)) + ascii.padEnd(Math.ceil(ascii.length/64)*64, "0");
};
const result = (n) => "0x" + w(n);
function mock({zero = false, missing = "", noCode = false, mismatch = false, calls = []} = {}) {
  return async (_url, method, params) => {
    calls.push([method,params]);
    if (method === "eth_chainId") return mismatch ? "0x2105" : "0x1";
    if (method === "eth_blockNumber") return "0x1234";
    if (method === "eth_getCode") return noCode ? "0x" : "0x60026002";
    assert.equal(method,"eth_call");
    assert.equal(params[1],"0x1234","eth_call must use frozen block, not latest");
    const [{to,data}] = params;
    if (data.startsWith(SELECTORS.asset)) return encAddr(A);
    if (data.startsWith(SELECTORS.totalAssets)) return result(1000000000n);
    if (data.startsWith(SELECTORS.decimals)) return result(to.toLowerCase() === A.toLowerCase() ? 6 : 18);
    if (data.startsWith(SELECTORS.symbol)) return encString(to.toLowerCase() === A.toLowerCase() ? "USDtest" : "vUSD");
    if (data.startsWith(SELECTORS.balanceOf)) return result(2000000000000000000n);
    if (data.startsWith(SELECTORS.maxWithdraw)) {
      if (missing === "maxWithdraw") throw Error("RPC error");
      return result(zero ? 0n : 1200000n);
    }
    if (data.startsWith(SELECTORS.maxRedeem)) return result(zero ? 0n : 1200000000000000000n);
    if (data.startsWith(SELECTORS.previewRedeem)) return result(1180000n);
    if (data.startsWith(SELECTORS.convertToAssets)) return result(2000000n);
    throw Error("unexpected selector " + data.slice(0,10));
  };
}
test("public-address-only and zero addresses rejected", () => {
  assert.equal(requireAddress(O),O);
  for(const x of ["","0x123", "0x"+"0".repeat(40)," 0xXYZ ", "0x"+"a".repeat(39)]) assert.throws(()=>requireAddress(x));
});
test("ABI selector constants use real ERC-4626 signatures", () => {
  assert.deepEqual([SELECTORS.maxWithdraw,SELECTORS.maxRedeem,SELECTORS.previewRedeem,SELECTORS.asset],["0xce96cb77","0xd905777e","0x4cdad506","0x38d52e0f"]);
});
test("ABI owner encoding and 256-bit boundaries", () => {
  assert.equal(encodeAddress(O).length,64);
  assert.equal(encodeUint256(0n), "0".repeat(64));
  assert.equal(encodeUint256((1n<<256n)-1n),"f".repeat(64));
  for(const x of [-1n,1n<<256n,42]) assert.throws(()=>encodeUint256(x));
});
test("strict ABI returns distinguish errors from zero", () => {
  assert.equal(decodeUint("0x"+w(0n)),0n);
  assert.throws(()=>decodeUint("0x"));
  assert.throws(()=>decodeUint("0xffff"));
  assert.throws(()=>decodeAddress("0x"+w((1n<<160n))));
});
test("ABI dynamic and legacy bytes32 symbols", () => {
  assert.equal(decodeString(encString("sDAI")),"sDAI");
  assert.equal(decodeString("0x"+Buffer.from("USDC").toString("hex").padEnd(64,"0")),"USDC");
  assert.throws(()=>decodeString(encString("\u0000")));
  assert.throws(()=>decodeString("0x" + w(32n) + w(1000000n)));
});
test("exact decimal formatting never relies on floating point", () => {
  assert.equal(formatUnits(1500000n,6),"1.5");
  assert.equal(formatUnits(1200000000000000000n,18),"1.2");
  assert.equal(formatUnits(0n,6),"0");
  assert.equal(formatUnits(1n,6),"0.000001");
  assert.equal(formatUnits(1n,18),"<0.000001");
  assert.equal(formatUnits(12345n,null),"12345 (raw units)");
});
test("network IDs are distinct and mainnet, no sandbox chain", () => {
  assert.deepEqual(Object.values(CHAINS).map(c=>c.id),[1,8453,42161]);
});
test("chain mismatch fails closed before contract reads", async () => {
  const calls=[];
  await assert.rejects(inspectVault({vault:V,call:mock({mismatch:true,calls})}),/chain mismatch/);
  assert.deepEqual(calls.map(x=>x[0]),["eth_chainId"]);
});
test("missing deployed contract bytecode rejects the result", async () => {
  await assert.rejects(inspectVault({vault:V,call:mock({noCode:true})}),/No EVM contract code/);
});
test("metadata-only snapshot does not assert per-owner withdraw", async () => {
  const s=await inspectVault({vault:V,call:mock()});
  assert.equal(s.blockNumber,4660n);
  assert.equal(s.assetSymbol,"USDtest");
  assert.equal(s.assetDecimals,6);
  assert.equal(s.shareDecimals,18);
  assert.equal(s.totalAssets,1000000000n);
  assert.equal(s.limits.maxWithdraw,null);
  assert.match(describePosition(s),/cannot establish withdrawability/);
  assert.equal(serializeSnapshot(s).maxWithdrawAssetsRaw,null);
});
test("positive owner limits do not claim guaranteed liquidity", async () => {
  const calls=[];
  const s=await inspectVault({vault:V,owner:O,call:mock({calls})});
  assert.equal(s.limits.balance,2000000000000000000n);
  assert.equal(s.limits.maxWithdraw,1200000n);
  assert.equal(s.limits.maxRedeem,1200000000000000000n);
  assert.equal(s.limits.previewRedeem,1180000n);
  assert.equal(s.limits.balanceAsAssets,2000000n);
  assert.match(describePosition(s),/not a transaction simulation/);
  assert.equal(serializeSnapshot(s).maxWithdrawAssetsRaw,"1200000");
  assert.equal(calls.filter(x=>x[0]==="eth_call").length,11);
});
test("zero exit limit with nonzero shares is a clear warning", async () => {
  const s=await inspectVault({vault:V,owner:O,call:mock({zero:true})});
  assert.equal(s.limits.maxWithdraw,0n);
  assert.equal(s.limits.maxRedeem,0n);
  assert.match(describePosition(s),/returned zero despite vault shares/);
});
test("RPC errors do not silently become zero", async () => {
  const s=await inspectVault({vault:V,owner:O,call:mock({missing:"maxWithdraw"})});
  assert.equal(s.limits.maxWithdraw,null);
  assert.ok(s.errors.some(e=>e.startsWith("owner maxWithdraw")));
  assert.match(describePosition(s),/Unknown/);
  assert.equal(serializeSnapshot(s).maxWithdrawAssetsRaw,null);
});
test("owner address is included only when deliberately provided", async () => {
  const s=await inspectVault({vault:V,call:mock()});
  assert.equal(serializeSnapshot(s).owner,null);
  assert.equal(JSON.stringify(serializeSnapshot(s)).includes("privateKey"),false);
});

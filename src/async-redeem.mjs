// SPDX-License-Identifier: MIT
// Optional ERC-7540 queued redemption inspector. READ-ONLY. This module can
// report public contract assertions at one block, not an exit guarantee.
// Official standard: https://eips.ethereum.org/EIPS/eip-7540
import {CHAINS, requireAddress, encodeAddress, encodeUint256, rpc} from "./core.mjs";

export const ASYNC_REDEEM_SELECTORS = Object.freeze({
  supportsInterface: "0x01ffc9a7",
  pendingRedeemRequest: "0xf5a23d8d",
  claimableRedeemRequest: "0xeaed1d07"
});
export const REQUIRED_7540_INTERFACES = Object.freeze([
  "0x620ee8e4", // async redemption, mandated for redemptions
  "0xe3bc4e65", // common operator interface, mandated for ERC-7540
  "0x2f0a18c5"  // ERC-7575 share interface, mandated for ERC-7540
]);

export function parseRequestId(text) {
  // The requestId is an exact decimal uint256. Do not coerce to Number:
  // Number loses bits and can check a different investor request.
  if (typeof text !== "string" || !/^(0|[1-9][0-9]{0,77})$/.test(text)) {
    throw Error("Request ID must be one exact nonnegative decimal uint256 (no signs, leading zeroes or exponent).");
  }
  const id = BigInt(text);
  if (id >= (1n << 256n)) throw Error("Request ID exceeds 256 bits.");
  return id;
}
function strictWord(hex) {
  if (typeof hex !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hex)) throw Error("No exact 32-byte ABI return word");
  return BigInt(hex);
}
function strictBool(hex) {
  const value = strictWord(hex);
  if (value !== 0n && value !== 1n) throw Error("Invalid ABI bool");
  return value === 1n;
}
export function interfaceCalldata(interfaceId) {
  if (!/^0x[0-9a-fA-F]{8}$/.test(interfaceId)) throw Error("Invalid ERC-165 interface id");
  return ASYNC_REDEEM_SELECTORS.supportsInterface + interfaceId.slice(2).toLowerCase().padEnd(64,"0");
}
export function redeemRequestCalldata(method, requestId, controller) {
  const signature = ASYNC_REDEEM_SELECTORS[method];
  if (!signature || method === "supportsInterface") throw Error("Unsupported read-only ERC-7540 method");
  return signature + encodeUint256(requestId) + encodeAddress(controller);
}
export function explainAsyncState(s) {
  if (s.interfaceState !== "DECLARED_ASYNC_REDEEM") {
    return "ERC-7540 async redemption support was NOT verified. No request amount was checked; never interpret this as zero pending shares or as synchronous withdrawal availability.";
  }
  if (s.pendingShares === null || s.claimableShares === null) {
    return "At least one request view failed or returned malformed data. Status UNKNOWN, not zero; check the protocol's official queue and source.";
  }
  if (s.pendingShares > 0n && s.claimableShares > 0n) {
    return "The vault REPORTED both pending and claimable shares for this controller/request ID at the sampled block. This is not a transaction execution promise.";
  }
  if (s.pendingShares > 0n) return "The vault REPORTED pending redemption shares, not yet claimable by this request view. Timing and receipt of assets are NOT guaranteed.";
  if (s.claimableShares > 0n) return "The vault REPORTED claimable redemption shares. Claiming still requires a separate authorized transaction and may fail; the future asset amount is NOT calculated here.";
  return "Both request views REPORTED zero shares for this controller and request ID. That could mean never requested, wrong controller/ID, already claimed, or other protocol-specific state; it does NOT establish no outstanding requests elsewhere.";
}
export async function inspectAsyncRedeem({
  chain = "ethereum", vault, controller, requestId = "0", blockTag = null, call = rpc
}) {
  const cfg = CHAINS[chain];
  if (!cfg) throw Error("Unsupported network");
  const address = requireAddress(vault);
  const who = requireAddress(controller);
  const id = parseRequestId(requestId);
  const dispatch = (method, params) => call(cfg.rpc, method, params);
  const remoteChain = await dispatch("eth_chainId", []);
  if (typeof remoteChain !== "string" || !/^0x[0-9a-fA-F]+$/.test(remoteChain) ||
      BigInt(remoteChain) !== BigInt(cfg.id)) throw Error("RPC chain mismatch: refusing cross-chain async request claims.");
  const block = blockTag === null ? await dispatch("eth_blockNumber", []) : blockTag;
  if (typeof block !== "string" || !/^0x[0-9a-fA-F]+$/.test(block) || BigInt(block) === 0n)
    throw Error("Invalid pinned block; no request amount read.");
  const bytecode = await dispatch("eth_getCode", [address, block]);
  if (typeof bytecode !== "string" || !/^0x[0-9a-fA-F]*$/.test(bytecode) ||
      bytecode === "0x" || bytecode === "0x0") throw Error("No deployed vault contract at sampled block.");
  const warnings = [];
  async function view(label, data, decode) {
    try {
      const response = await dispatch("eth_call", [{to:address, data}, block]);
      return decode(response);
    } catch(e) {
      warnings.push(label + ": " + String(e?.message || e).slice(0,70));
      return null;
    }
  }
  const interfaces = [...REQUIRED_7540_INTERFACES, "0xffffffff"];
  const results = await Promise.all(interfaces.map(id =>
    view("supportsInterface("+id+")", interfaceCalldata(id), strictBool)));
  // No interface support must NOT become two false zero balances. ERC-165
  // invalid 0xffffffff MUST be false. Skip requests on uncertain conformance.
  const confirmed = results.slice(0,3).every(v=>v === true) && results[3] === false;
  const interfaceState = confirmed ? "DECLARED_ASYNC_REDEEM"
     : results[0] === false ? "REDEEM_INTERFACE_FALSE"
     : "NOT_CONFIRMED";
  let pendingShares = null, claimableShares = null;
  if(confirmed){
    const values = await Promise.all([
      view("pendingRedeemRequest", redeemRequestCalldata("pendingRedeemRequest",id,who), strictWord),
      view("claimableRedeemRequest", redeemRequestCalldata("claimableRedeemRequest",id,who), strictWord)
    ]);
    [pendingShares, claimableShares] = values;
  }
  const report = {
    schema:1, standard:"ERC-7540", chain, chainId:cfg.id, rpc:cfg.rpc,
    vault:address, controller:who, requestId:id.toString(), block, blockNumber:BigInt(block),
    erc165Probes:Object.fromEntries(interfaces.map((iface,i)=>[iface,results[i]])),
    interfaceState, pendingShares, claimableShares, warnings
  };
  return {...report, explanation:explainAsyncState(report)};
}
export function serializeAsyncEvidence(s) {
  return {
    schema:s.schema, standard:s.standard, chain:s.chain, chainId:s.chainId, rpc:s.rpc,
    vault:s.vault, controller:s.controller, requestId:s.requestId,
    blockNumber:s.blockNumber.toString(),
    erc165Probes:s.erc165Probes, interfaceState:s.interfaceState,
    pendingRedeemSharesRaw:s.pendingShares === null ? null : s.pendingShares.toString(),
    claimableRedeemSharesRaw:s.claimableShares === null ? null : s.claimableShares.toString(),
    warnings:s.warnings, explanation:s.explanation,
    transactionSubmitted:false, walletSigned:false, externalPaymentMade:false,
    actualClaimExecutionVerified:false, actualAssetsRedeemableNotGuaranteed:true,
    caveat:"One public RPC / historical block. Claimed interface support and balances are not contract-security audits, proof of request existence elsewhere, token liquidity, or authorized asset claims."
  };
}

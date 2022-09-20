import { Buffer } from "buffer";
import type {
  CIP30Instance,
  Datum,
  DbUTXO,
  HexString,
  KuberBuyRequest,
  KuberMintRequest,
  NftMetadata,
} from "@/types";
import {
  Address,
  BaseAddress,
  Ed25519KeyHash,
  StakeCredential,
} from "@emurgo/cardano-serialization-lib-asmjs";
import { market } from "@/config";
import { calculatePolicyHash, callKuberAndSubmit } from "./wallet";

function genStakeCredential(keyhash: HexString) {
  return StakeCredential.from_keyhash(
    Ed25519KeyHash.from_bytes(Buffer.from(keyhash, "hex"))
  );
}

export function genSellerAddr(datum: Datum): string {
  const sellerPubKeyHashHex =
    "fields" in datum &&
    "fields" in datum.fields[0] &&
    "fields" in datum.fields[0].fields[0] &&
    "bytes" in datum.fields[0].fields[0].fields[0]
      ? datum.fields[0].fields[0].fields[0].bytes
      : null;
  const sellerStakeKeyHashHex =
    "fields" in datum &&
    "fields" in datum.fields[0] &&
    "fields" in datum.fields[0].fields[1] &&
    "bytes" in datum.fields[0].fields[1].fields[0]
      ? datum.fields[0].fields[1].fields[0].bytes
      : null;

  if (sellerPubKeyHashHex && sellerStakeKeyHashHex) {
    const [vkey, stakeKey] = [sellerPubKeyHashHex, sellerStakeKeyHashHex].map(
      genStakeCredential
    );
    return BaseAddress.new(0, vkey, stakeKey)
      .to_address()
      .to_bech32("addr_test");
  } else {
    throw "Error: malformed datum";
  }
}

export function buyHandler(
  utxo: DbUTXO
): (provider: CIP30Instance) => Promise<any> {
  const datum = utxo.datum;
  // validation required to ensure datum is correctly structured:
  const value =
    "fields" in datum && datum.fields[1] && "int" in datum.fields[1]
      ? datum.fields[1].int.toString()
      : null; // what should go here if validation fails?
  if (value) {
    return async function (provider: CIP30Instance) {
      const { address, script } = market;
      const request: KuberBuyRequest = {
        selections: await provider.getUtxos(),
        inputs: [
          {
            address,
            datum,
            redeemer: { fields: [], constructor: 0 },
            script,
            utxo: {
              hash: utxo.tx_hash,
              index: utxo.tx_index,
            },
          },
        ],
        outputs: [
          {
            address: genSellerAddr(datum),
            value,
          },
        ],
      };
      return callKuberAndSubmit(provider, request);
    };
  }
  throw new Error("Missing value");
}

function makeKeyHash(cred: StakeCredential): string {
  const keyHash = cred.to_keyhash();
  if (typeof keyHash !== "undefined") {
    return Buffer.from(keyHash.to_bytes()).toString("hex");
  }
  throw new Error("keyHash is undefined");
}

export function makePubKeyHash(addr: BaseAddress): string {
  const cred = addr.payment_cred();
  return makeKeyHash(cred);
}

export function makeStakeKeyHash(addr: BaseAddress): string {
  const cred = addr.stake_cred();
  return makeKeyHash(cred);
}

export async function getUserAddrHash(
  instance: CIP30Instance
): Promise<HexString> {
  const unusedAddrs: string[] = await instance.getUnusedAddresses();
  const addresses: string[] =
    unusedAddrs.length == 0 ? await instance.getUsedAddresses() : unusedAddrs;
  const userAddr = BaseAddress.from_address(
    Address.from_bytes(Uint8Array.from(Buffer.from(addresses[0], "hex")))
  );
  if (typeof userAddr !== "undefined") {
    return makePubKeyHash(userAddr);
  }
  throw new Error("userAddr is undefined");
}

export async function buildMintRequest(
  selections: string[],
  keyHash: HexString,
  metadata: NftMetadata
): Promise<KuberMintRequest> {
  const token = Buffer.from(metadata.name, "utf-8").toString("hex");
  const policyId: string = await calculatePolicyHash({
    type: "sig",
    keyHash,
  });
  console.log("policy", policyId);
  return {
    selections,
    mint: [
      {
        script: {
          type: "sig",
          keyHash,
        },
        amount: {
          [token]: 1,
        },
      },
    ],
    metadata: {
      721: {
        [policyId]: {
          [token]: metadata,
        },
      },
    },
  };
}

export async function getUsedAddr(instance: CIP30Instance): Promise<BaseAddress> {
  const addresses = await instance.getUsedAddresses();
  const addr = BaseAddress.from_address(
    Address.from_bytes(Uint8Array.from(Buffer.from(addresses[0], "hex")))
  );
  if (typeof addr !== "undefined") {
    return addr;
  }
  throw new Error("addr is undefined");
}

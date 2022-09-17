import { Buffer } from "buffer";
import type { CIP30Instance, Datum, DbUTXO, HexString } from "@/types";
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

export function genSellerAddr(datum: Datum) {
  const sellerPubKeyHashHex: HexString =
    datum.fields[0].fields[0].fields[0].bytes;
  const sellerStakeKeyHashHex: HexString =
    datum.fields[0].fields[1].fields[0].bytes;
  const [vkey, stakeKey] = [sellerPubKeyHashHex, sellerStakeKeyHashHex].map(
    genStakeCredential
  );
  return BaseAddress.new(0, vkey, stakeKey).to_address().to_bech32("addr_test");
}

export function buyHandler(
  utxo: DbUTXO
): (provider: CIP30Instance) => Promise<any> {
  const datum = utxo.datum;
  const value = datum.fields[1].int;
  return async function (provider: CIP30Instance) {
    const { address, script } = market;
    const request = {
      selections: await provider.getUtxos(),
      inputs: [
        {
          address,
          utxo: {
            hash: utxo.tx_hash,
            index: utxo.tx_index,
          },
          script,
          // upstream comment:
          // value: `2A + ${nft.policy}.${nft.asset_name}`,
          datum,
          redeemer: { fields: [], constructor: 0 },
        },
      ],
      outputs: [
        {
          address: genSellerAddr(datum),
          value,
        },
      ],
    };
    return callKuberAndSubmit(provider, JSON.stringify(request));
  };
}

export async function getUserAddrHash(
  instance: CIP30Instance
): Promise<HexString> {
  const unusedAddrs: string[] = await instance.getUnusedAddresses();
  const addrs: string[] =
    unusedAddrs.length == 0 ? await instance.getUsedAddresses() : unusedAddrs;
  const userAddr = BaseAddress.from_address(
    Address.from_bytes(Uint8Array.from(Buffer.from(addrs[0], "hex")))
  );
  return Buffer.from(userAddr.payment_cred().to_keyhash().to_bytes()).toString(
    "hex"
  );
}

export async function buildMintRequest(selections: string[], keyHash: HexString, metadata): Promise<string> {
  const token = Buffer.from(metadata.name, "utf-8").toString("hex");
  const policyId: string = await calculatePolicyHash({
    type: "sig",
    keyHash,
  });
  console.log("policy", policyId);
  const request = {
    selections,
    mint: [
      {
        script: {
          type: "sig",
          keyHash,
        },
        amount: {
          tokenName: 1,
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
  return JSON.stringify(request)
}

import { Buffer } from "buffer";
import type { CIP30Instance, Datum, DbUTXO, HexString } from "@/types";
import {
  BaseAddress,
  Ed25519KeyHash,
  StakeCredential,
} from "@emurgo/cardano-serialization-lib-asmjs";
import { market } from "@/config";
import { callKuberAndSubmit } from "./wallet";

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

export function buyHandler(utxo: DbUTXO): (provider: CIP30Instance) => Promise<any> {
  const datum = utxo.datum
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

// @ts-nocheck
import {
  AssetName,
  BigNum,
  MultiAsset,
  ScriptHash,
  TransactionUnspentOutput,
  Value,
} from "@emurgo/cardano-serialization-lib-asmjs";

declare global {
  interface Window {
    cardano: any;
  }
}

import type {
  CIP30Instance,
  CIP30Provider,
  MultiAssetObj,
  NftMetadata,
  PolicyId,
  TokenName,
  WalletValue,
} from "@/types";
import { Buffer } from "buffer";
import { getNftMetadata } from "./blockfrost";

/**
 * Wallet display-related functions
 */
 export function listProviders(): CIP30Provider[] {
  if (!window.cardano) {
    return [];
  }
  const providers = Object.keys(window.cardano).reduce(
    (ps: CIP30Provider[], k: string) => {
      const plugin = window.cardano[k];
      return plugin.enable && plugin.name ? [...ps, plugin] : ps;
    },
    []
  );
  console.log("Providers", providers);
  return providers;
}

export function getWalletValue(
  utxos: string[]
): WalletValue {
  // prepare draft wallet value (lovelace balance in `BigNum` format)
  const walletValDraft = utxos.reduce(
    (
      acc: {
        lovelace: BigNum;
        multiassets: {
          [key: PolicyId]: {
            [key: TokenName]: bigint;
          };
        };
      },
      u: string
    ) => {
      const utxo = TransactionUnspentOutput.from_bytes(Buffer.from(u, "hex"));
      const value: Value = utxo.output().amount();
      // update accumulator lovelace balance
      const lovelace: BigNum = acc.lovelace.checked_add(value.coin());
      // update accumulator multiassets
      const multiassets: {
        [key: PolicyId]: {
          [key: TokenName]: bigint;
        };
      } = { ...acc.multiassets };
      // make assets map from value and iterate over to update accumulated multiassets
      makeAssetsMap(value).forEach(
        (assetNameMap: Map<AssetName, BigNum>, scriptHash: ScriptHash) => {
          const policy: PolicyId = Buffer.from(scriptHash.to_bytes()).toString(
            "hex"
          );
          assetNameMap.forEach((q: BigNum, a: AssetName) => {
            const assetName: string = Buffer.from(a.name()).toString("hex");
            console.log(`Policy: ${policy}`);
            console.log(`Asset Name: ${assetName}`);
            const qInt = BigInt(q.to_str());
            // if (!multiassets[policy]) {
            //   multiassets[policy] = { [assetName]: qInt };
            // } else {
            //   multiassets[policy][assetName] = qInt;
            // }
            (!multiassets[policy] &&
              (multiassets[policy] = { [assetName]: qInt })) ||
              (multiassets[policy][assetName] = qInt);
          });
        }
      );
      console.log("multiassets", multiassets);
      // return new accumulator
      return { lovelace, multiassets };
    },
    // initial accumulator value
    { lovelace: BigNum.zero(), multiassets: {} }
  );
  // convert final lovelace balance to bigint
  return {
    ...walletValDraft,
    lovelace: BigInt(walletValDraft.lovelace.to_str()),
  };
}

function makeAssetsMap(value: Value): Map<ScriptHash, Map<AssetName, BigNum>> {
  /**
   * Helper function for `getWalletValue`
   */

  const assetsMap: Map<ScriptHash, Map<AssetName, BigNum>> = new Map();
  const ma: MultiAsset | undefined = value.multiasset();
  if (typeof ma !== "undefined") {
    const multiAssets = value.multiasset()?.keys();
    if (typeof multiAssets !== "undefined") {
      for (let j = 0; j < multiAssets.len(); j++) {
        const policy: ScriptHash = multiAssets.get(j);
        const policyAssets = ma.get(policy);
        if (typeof policyAssets !== "undefined") {
          const assetNames = policyAssets.keys();
          if (typeof assetNames !== "undefined") {
            const assetNameMap = new Map();
            assetsMap.set(policy, assetNameMap);
            for (let k = 0; k < assetNames.len(); k++) {
              const policyAsset: AssetName = assetNames.get(k);
              const oldQ = assetNameMap.get(policyAsset);
              const newQ = policyAssets.get(policyAsset);
              assetNameMap.set(
                policyAsset,
                oldQ ? oldQ.checked_add(newQ) : newQ
              );
            }
          } else {
            throw new Error("assetNames is undefined");
          }
        } else {
          throw new Error("policyAssets is undefined");
        }
      }
    } else {
      throw new Error("multiAssets is undefined");
    }
  }
  return assetsMap;
}

export async function makeMultiAssetObj(
  /**
   * Prepares an object containing multiasset info and metadata
   */
  policy: string,
  token: string
): Promise<MultiAssetObj> {
  const asset: string = policy + token;
  const metadata: NftMetadata = await getNftMetadata(asset);
  return { asset, metadata, policy, tokenName: decodeAssetName(token) };
}

export function decodeAssetName(asset: string): string {
  return Buffer.from(asset, "hex").toString("utf-8");
}

export function transformNftImageUrl(url: string): string {
  if (!url) {
    return "";
  }
  const result = /^([a-zA-Z0-9+]+):\/\/(.+)/.exec(url);
  if (result && result[1] && (result[1] == "ipfs" || result[1] == "ipns")) {
    return "https://ipfs.io/" + result[1] + "/" + result[2];
  }
  return url;
}

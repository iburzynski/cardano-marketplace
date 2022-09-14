import { kuberApiUrl } from "@/config";
// @ts-nocheck
import {
  Address,
  AssetName,
  AssetNames,
  Assets,
  BaseAddress,
  BigNum,
  Ed25519KeyHash,
  EnterpriseAddress,
  hash_auxiliary_data,
  MultiAsset,
  PointerAddress,
  ScriptHash,
  ScriptHashes,
  StakeCredential,
  Transaction,
  TransactionBody,
  TransactionUnspentOutput,
  TransactionWitnessSet,
  Value,
  Vkeywitnesses,
} from "@emurgo/cardano-serialization-lib-asmjs";

declare global {
  interface Window {
    cardano: any;
  }
}

import type { CIP30Instance, CIP30Provider, WalletValue } from "@/types";
import { Buffer } from "buffer";

export async function signAndSubmit(provider: CIP30Instance, _tx: string) {
  let tx: Transaction;
  try {
    tx = Transaction.from_bytes(Uint8Array.from(Buffer.from(_tx, "hex")));

    if (tx.auxiliary_data()) {
      const _txBody = tx.body();
      // create new tx body
      const txBody = TransactionBody.new(
        _txBody.inputs(),
        _txBody.outputs(),
        _txBody.fee(),
        _txBody.ttl()
      );
      txBody.set_auxiliary_data_hash(hash_auxiliary_data(tx.auxiliary_data()));
      [
        "collateral",
        "mint",
        "required_signers",
        "validity_start_interval_bignum, network_id",
      ].forEach((m) => {
        const content = _txBody[m]();
        if (content) txBody["set_" + m](content);
      });
      // if (_txBody.collateral()) txBody.set_collateral(_txBody.collateral());
      // if (_txBody.mint()) txBody.set_mint(_txBody.mint());
      // if (_txBody.required_signers()) {
      //   txBody.set_required_signers(_txBody.required_signers());
      // }
      // if (_txBody.validity_start_interval_bignum()) {
      //   txBody.set_validity_start_interval_bignum(
      //     _txBody.validity_start_interval_bignum()
      //   );
      // }
      // if (_txBody.network_id()) {
      //   txBody.set_network_id(_txBody.network_id());
      // }
      tx = Transaction.new(txBody, tx.witness_set(), tx.auxiliary_data());
    }
  } catch (e: any) {
    throw new Error("Invalid transaction string:" + e.message);
  }

  const newWitnessSet = TransactionWitnessSet.new();
  ["plutus_data", "plutus_scripts", "redeemers", "native_scripts"].forEach(
    (m) => {
      const w = tx.witness_set()[m]();
      if (w) newWitnessSet["set_" + m](w);
    }
  );
  // if (tx.witness_set().plutus_data())
  //   newWitnessSet.set_plutus_data(tx.witness_set().plutus_data());
  // if (tx.witness_set().plutus_scripts())
  //   newWitnessSet.set_plutus_scripts(tx.witness_set().plutus_scripts());
  // if (tx.witness_set().redeemers())
  //   newWitnessSet.set_redeemers(tx.witness_set().redeemers());
  // if (tx.witness_set().native_scripts())
  //   newWitnessSet.set_native_scripts(tx.witness_set().native_scripts());

  // add the new witness.

  const witnessesRaw = await provider.signTx(
    Buffer.from(tx.to_bytes()).toString("hex"),
    true
  );
  const newWitnesses = TransactionWitnessSet.from_bytes(
    Buffer.from(witnessesRaw, "hex")
  );

  if (tx.witness_set().vkeys()) {
    const newVkeySet = Vkeywitnesses.new();

    for (let i = 0; i < tx.witness_set().vkeys().len(); i++) {
      newVkeySet.add(tx.witness_set().vkeys().get(i));
    }

    for (let i = 0; i < newWitnesses.vkeys().len(); i++) {
      newVkeySet.add(newWitnesses.vkeys().get(i));
    }
    newWitnessSet.set_vkeys(newVkeySet);
  } else {
    newWitnessSet.set_vkeys(newWitnesses.vkeys());
  }
  tx = Transaction.new(tx.body(), newWitnessSet, tx.auxiliary_data());
  const signedTxString = Buffer.from(tx.to_bytes()).toString("hex");
  // @ts-ignore
  console.log({
    additionWitnessSet: witnessesRaw,
    finalTx: signedTxString,
  });
  return provider.submitTx(signedTxString);
}

export function listProviders(): CIP30Provider[] {
  if (!window.cardano) {
    return [];
  }
  const pluginMap = new Map();
  Object.keys(window.cardano).forEach((x: string) => {
    const plugin = window.cardano[x];
    if (plugin.enable && plugin.name) {
      pluginMap.set(plugin.name, plugin);
    }
  });
  const providers: CIP30Provider[] = Array.from(pluginMap.values());
  console.log("Providers", providers);
  return providers;
}

export async function callKuberAndSubmit(
  provider: CIP30Instance,
  data: string
) {
  let network = await provider.getNetworkId();
  console.log("Current Network:", network);
  let kuberUrlByNetwork = kuberApiUrl;

  return fetch(
    // eslint-disable-next-line max-len
    `${kuberUrlByNetwork}/api/v1/tx`,
    {
      mode: "cors",
      method: "POST",
      body: data,
      headers: new Headers({ "content-type": "application/json" }),
    }
  )
    .catch((e) => {
      console.error(`${kuberUrlByNetwork}/api/v1/tx`, e);
      throw Error(`Kubær API call: ` + e.message);
    })
    .then((res) => {
      if (res.status === 200) {
        return res.json().then((json) => {
          console.log(json);
          return signAndSubmit(provider, json.tx).catch((e) => {
            if (e.info && e.code) {
              throw Error(`Code: ${e.code} :: \n ${e.info}`);
            } else throw e;
          });
        });
      } else {
        return res.text().then((txt) => {
          let json: any;
          try {
            json = JSON.parse(txt);
          } catch (e) {
            return Promise.reject(
              Error(`KubærApi [Status ${res.status}]: ${txt}`)
            );
          }
          if (json) {
            return Promise.reject(
              Error(
                `KubærApi [Status ${res.status}]: ${
                  json.message ? json.message : txt
                }`
              )
            );
          } else {
            return Promise.reject(
              Error(`KubærApi [Status ${res.status}]: ${txt}`)
            );
          }
        });
      }
    });
}

export async function calculatePolicyHash(script: any): Promise<string> {
  return fetch(
    // eslint-disable-next-line max-len
    `${kuberApiUrl}/api/v1/scriptPolicy`,
    {
      mode: "cors",
      method: "POST",
      body: JSON.stringify(script),
      headers: new Headers({ "content-type": "application/json" }),
    }
  )
    .catch((e) => {
      console.error(`${kuberApiUrl}/api/v1/tx`, e);
      throw Error(`Kubær API call: ` + e.message);
    })
    .then((res) => {
      if (res.status === 200) {
        return res.text();
      } else {
        return res.text().then((txt) => {
          let json;
          try {
            json = JSON.parse(txt);
          } catch (e) {
            return Promise.reject(
              Error(`KubærApi [Status ${res.status}]: ${txt}`)
            );
          }
          if (json) {
            return Promise.reject(
              Error(
                `KubærApi [Status ${res.status}]: ${
                  json.message ? json.message : txt
                }`
              )
            );
          } else {
            return Promise.reject(
              Error(`KubærApi [Status ${res.status}]: ${txt}`)
            );
          }
        });
      }
    });
}

function makeAssetsMap(value: Value): Map<ScriptHash, Map<AssetName, BigNum>> {
  const assets: Map<ScriptHash, Map<AssetName, BigNum>> = new Map();
  if (value.multiasset()) {
    const multiAssets: ScriptHashes = value.multiasset().keys();
    for (let j = 0; j < multiAssets.len(); j++) {
      const policy: ScriptHash = multiAssets.get(j);
      const policyAssets: Assets = value.multiasset().get(policy);
      const assetNames: AssetNames = policyAssets.keys();
      const assetNameMap = new Map();
      assets.set(policy, assetNameMap);
      for (let k = 0; k < assetNames.len(); k++) {
        const policyAsset: AssetName = assetNames.get(k);
        const oldQ = assetNameMap.get(policyAsset);
        const newQ = policyAssets.get(policyAsset);
        assetNameMap.set(policyAsset, oldQ ? oldQ.checked_add(newQ) : newQ);
      }
    }
  }
  return assets;
}

export async function getWalletValue(
  provider: CIP30Instance
): Promise<WalletValue> {
  const utxos: TransactionUnspentOutput[] = (await provider.getUtxos()).map(
    (u: string) => TransactionUnspentOutput.from_bytes(Buffer.from(u, "hex"))
  );
  const walletVal = utxos.reduce(
    (walletVal: {lovelace: BigNum, multiassets: any}, utxo: TransactionUnspentOutput) => {
      const value: Value = utxo.output().amount();
      // update total lovelace
      const lovelace = walletVal.lovelace.checked_add(value.coin());
      // add multiassets
      const multiassets = { ...walletVal.multiassets };
      makeAssetsMap(value).forEach(
        (assetNameMap: Map<AssetName, BigNum>, scriptHash: ScriptHash) => {
          const policy: string = Buffer.from(scriptHash.to_bytes()).toString(
            "hex"
          );
          multiassets[policy] = multiassets[policy] || {};
          assetNameMap.forEach((q: BigNum, a: AssetName) => {
            const assetName: string = Buffer.from(a.name()).toString("hex");
            multiassets[policy][assetName] = BigInt(q.to_str());
          });
        }
      );
      console.log("multiassets", multiassets);
      return { lovelace, multiassets };
    },
    { lovelace: BigNum.zero(), multiassets: {} }
  );
  // convert lovelace to bigint
  return { ...walletVal, lovelace: BigInt(walletVal.lovelace.to_str()) };
}

// utxos.forEach((utxo: TransactionUnspentOutput) => {
//   const value: Value = utxo.output().amount();
// adaVal = adaVal.checked_add(value.coin());
// if (value.multiasset()) {
//   const multiAssets: ScriptHashes = value.multiasset().keys();

//   for (let j = 0; j < multiAssets.len(); j++) {
//     const policy: ScriptHash = multiAssets.get(j);
//     const policyAssets: Assets = value.multiasset().get(policy);
//     const assetNames: AssetNames = policyAssets.keys();

// let assetNameMap
// assets.get(policy)
// if (!assetNameMap) {
// assets.set(policy, assetNameMap = new Map());
// }

// for (let k = 0; k < assetNames.len(); k++) {
//   const policyAsset: AssetName = assetNames.get(k);
// let quantity = policyAssets.get(policyAsset);
// const oldQuantity: BigNum = assetNameMap.get(policyAsset);
// if (oldQuantity) {
//   quantity = oldQuantity.checked_add(quantity);
// }
// assetNameMap.set(policyAsset, quantity)
// }
// }
//   }
// });
// const assetObj = {};
// assets.forEach((k: Map<AssetName, BigNum>, v: ScriptHash) => {
//   const policy: string = Buffer.from(v.to_bytes()).toString("hex");
//   let policyMap;
//   if (assetObj[policy]) {
//     policyMap = assetObj[policy];
//   } else {
//     policyMap = {};
//     assetObj[policy] = policyMap;
//   }

//   k.forEach((q: BigNum, a: AssetName) => {
//     const assetName: string = Buffer.from(a.name()).toString("hex");
//     policyMap[assetName] = BigInt(q.to_str());
//   });
// });
// console.log("policymap", assetObj);

// return {
//   lovelace: BigInt(adaVal),
//   multiassets: assetObj,
// };

export function decodeAssetName(asset: string) {
  try {
    return Buffer.from(asset, "hex").toString("utf-8");
  } catch (e) {}
}

export function renderLovelace(l: bigint | number): number {
  if (typeof l === "number") {
    return Math.floor(l / 1e4) / 100;
  }
  return l && parseFloat((l / BigInt(10000)).toString()) / 100;
}

export function transformNftImageUrl(url: string): string {
  if (!url) {
    return null;
  }
  console.log(url)
  const result = /^([a-zA-Z0-9+]+):\/\/(.+)/.exec(url);
  if (result && result[1] && (result[1] == "ipfs" || result[1] == "ipns")) {
    return "https://ipfs.io/" + result[1] + "/" + result[2];
  }
  return url;
}

import { Buffer } from "buffer";
import type {
  CIP30Instance,
  Datum,
  DbUTXO,
  HexString,
  KuberBuyRequest,
  KuberMintRequest,
  KuberRequest,
  KuberSellRequest,
  MultiAssetObj,
  NftMetadata,
  Script,
  UserKeyhashes,
} from "@/types";
import {
  Address,
  BaseAddress,
  Ed25519KeyHash,
  hash_auxiliary_data,
  StakeCredential,
  Transaction,
  TransactionBody,
  TransactionWitnessSet,
  Vkeywitnesses,
} from "@emurgo/cardano-serialization-lib-asmjs";
import { kuberApiUrl, market } from "@/config";

export function buildBuyRequest(
  selections: string[],
  { datum, tx_hash, tx_index }: DbUTXO
): KuberBuyRequest {
  // validation required to ensure datum is correctly structured:
  const value =
    "fields" in datum && datum.fields[1] && "int" in datum.fields[1]
      ? datum.fields[1].int.toString()
      : null; // what should go here if validation fails?
  if (value) {
    const { address, script } = market;
    return {
      selections,
      inputs: [
        {
          address,
          datum,
          redeemer: { fields: [], constructor: 0 },
          script,
          utxo: {
            hash: tx_hash,
            index: tx_index,
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
  }
  throw new Error("Missing value");
}

function genSellerAddr(datum: Datum): string {
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

function genStakeCredential(keyhash: HexString): StakeCredential {
  return StakeCredential.from_keyhash(
    Ed25519KeyHash.from_bytes(Buffer.from(keyhash, "hex"))
  );
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

export async function buildSellRequest(
  asset: MultiAssetObj,
  selections: string[],
  sellAmount: number,
  { pubKeyhash, stakeKeyhash }: UserKeyhashes
): Promise<KuberSellRequest> {
  return {
    selections,
    outputs: [
      {
        address: market.address,
        value: `2A + 1 ${asset.policy}.${asset.tokenName}`,
        datum: {
          fields: [
            {
              fields: [
                { fields: [{ bytes: `${pubKeyhash}` }], constructor: 0 },
                { fields: [{ bytes: `${stakeKeyhash}` }], constructor: 1 },
              ],
              constructor: 0,
            },
            { int: sellAmount },
          ],
          constructor: 0,
        },
      },
    ],
  };
}

export async function calculatePolicyHash(script: Script): Promise<string> {
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
    .then(async (res) => {
      if (res.status === 200) {
        return res.text();
      } else {
        const txt = await res.text();
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
      }
    });
}

/**
 * Transaction Submission
 */
export async function submitToKuber(
  instance: CIP30Instance,
  request: KuberRequest
) {
  const body = JSON.stringify(request);
  const network = await instance.getNetworkId();
  console.log("Current Network:", network);
  console.log(body);
  const kuberUrlByNetwork = kuberApiUrl;

  return fetch(
    // eslint-disable-next-line max-len
    `${kuberUrlByNetwork}/api/v1/tx`,
    {
      mode: "cors",
      method: "POST",
      body,
      headers: new Headers({ "content-type": "application/json" }),
    }
  )
    .catch((e) => {
      console.error(`${kuberUrlByNetwork}/api/v1/tx`, e);
      throw Error(`Kubær API call: ` + e.message);
    })
    .then(async (res) => {
      console.log(res.status);
      if (res.status === 200) {
        const json = await res.json();
        console.log(json);
        try {
          return await signAndSubmit(instance, json.tx);
        } catch (e: any) {
          if (e.info && e.code) {
            throw Error(`Code: ${e.code} :: \n ${e.info}`);
          } else throw e;
        }
      } else {
        const txt = await res.text();
        let json_1: any;
        try {
          json_1 = JSON.parse(txt);
        } catch (e_1) {
          return Promise.reject(
            Error(`KubærApi [Status ${res.status}]: ${txt}`)
          );
        }
        if (json_1) {
          return Promise.reject(
            Error(
              `KubærApi [Status ${res.status}]: ${
                json_1.message ? json_1.message : txt
              }`
            )
          );
        } else {
          return Promise.reject(
            Error(`KubærApi [Status ${res.status}]: ${txt}`)
          );
        }
      }
    });
}

async function signAndSubmit(
  instance: CIP30Instance,
  tx: string
): Promise<any> {
  try {
    const txDraft1: Transaction = Transaction.from_bytes(
      Uint8Array.from(Buffer.from(tx, "hex"))
    );
    const txDraft2 = makeAuxDataDraft(txDraft1);

    const witnessSet = TransactionWitnessSet.new();
    // ["plutus_data", "plutus_scripts", "redeemers", "native_scripts"].forEach(
    //   (m: string): void => {
    //     const w = txDraft2.witness_set()[m]();
    //     if (w) witnessSet["set_" + m](w);
    //   }
    // );
    const plutusData = txDraft2.witness_set().plutus_data();
    if (typeof plutusData !== "undefined")
      witnessSet.set_plutus_data(plutusData);
    const plutusScripts = txDraft2.witness_set().plutus_scripts();
    if (typeof plutusScripts !== "undefined")
      witnessSet.set_plutus_scripts(plutusScripts);
    const redeemers = txDraft2.witness_set().redeemers();
    if (typeof redeemers !== "undefined") witnessSet.set_redeemers(redeemers);
    const nativeScripts = txDraft2.witness_set().native_scripts();
    if (typeof nativeScripts !== "undefined")
      witnessSet.set_native_scripts(nativeScripts);

    // add the new witness.

    const witnessesRaw: HexString = await instance.signTx(
      Buffer.from(txDraft2.to_bytes()).toString("hex"),
      true
    );
    const oldVkws = txDraft2.witness_set().vkeys();
    const newVkws = TransactionWitnessSet.from_bytes(
      Buffer.from(witnessesRaw, "hex")
    ).vkeys();
    if (typeof oldVkws !== "undefined" && typeof newVkws !== "undefined") {
      const newVkeySet: Vkeywitnesses = Vkeywitnesses.new();
      for (let i = 0; i < oldVkws.len(); i++) {
        newVkeySet.add(oldVkws.get(i));
      }
      for (let i = 0; i < newVkws.len(); i++) {
        newVkeySet.add(newVkws.get(i));
      }
      witnessSet.set_vkeys(newVkeySet);
    } else if (typeof newVkws !== "undefined") {
      witnessSet.set_vkeys(newVkws);
    } else {
      throw new Error("undefined vkey witnesses");
    }
    const signedTx = Transaction.new(
      txDraft2.body(),
      witnessSet,
      txDraft2.auxiliary_data()
    );
    const signedTxString: HexString = Buffer.from(signedTx.to_bytes()).toString(
      "hex"
    );
    // @ts-ignore
    console.log({
      additionWitnessSet: witnessesRaw,
      finalTx: signedTxString,
    });
    return instance.submitTx(signedTxString);
  } catch (e: any) {
    throw new Error("Invalid transaction string:" + e.message);
  }
}

function makeAuxDataDraft(tx: Transaction): Transaction {
  const auxData = tx.auxiliary_data();
  if (typeof auxData !== "undefined") {
    const _txBody = tx.body();
    // create new tx body
    const txBody = TransactionBody.new(
      _txBody.inputs(),
      _txBody.outputs(),
      _txBody.fee(),
      _txBody.ttl()
    );
    txBody.set_auxiliary_data_hash(hash_auxiliary_data(auxData));

    const collateral = _txBody.collateral();
    if (typeof collateral !== "undefined") txBody.set_collateral(collateral);
    const mint = _txBody.mint();
    if (typeof mint !== "undefined") txBody.set_mint(mint);
    const signers = _txBody.required_signers();
    if (typeof signers !== "undefined") {
      txBody.set_required_signers(signers);
    }
    const interval = _txBody.validity_start_interval_bignum();
    if (typeof interval !== "undefined") {
      txBody.set_validity_start_interval_bignum(interval);
    }
    const network = _txBody.network_id();
    if (typeof network !== "undefined") {
      txBody.set_network_id(network);
    }
    console.log(txBody);
    const txDraft2 = Transaction.new(
      txBody,
      tx.witness_set(),
      tx.auxiliary_data()
    );
    console.log(txDraft2);
    return txDraft2;
  }
  return tx;
}

export async function getUserKeyhashes(
  instance: CIP30Instance
): Promise<UserKeyhashes> {
  const unusedAddrs: string[] = await instance.getUnusedAddresses();
  const addresses: string[] =
    unusedAddrs.length == 0 ? await instance.getUsedAddresses() : unusedAddrs;
  const userAddr = BaseAddress.from_address(
    Address.from_bytes(Uint8Array.from(Buffer.from(addresses[0], "hex")))
  );
  if (typeof userAddr !== "undefined") {
    return makeUserKeyhashes(userAddr);
  }
  throw new Error("userAddr is undefined");
}

function makeUserKeyhashes(addr: BaseAddress): UserKeyhashes {
  return {
    pubKeyhash: credToKeyHash(addr.payment_cred()),
    stakeKeyhash: credToKeyHash(addr.stake_cred()),
  };
}

function credToKeyHash(cred: StakeCredential): HexString {
  const keyHash = cred.to_keyhash();
  if (typeof keyHash !== "undefined") {
    return Buffer.from(keyHash.to_bytes()).toString("hex");
  }
  throw new Error("keyHash is undefined");
}

// export async function getUsedAddr(
//   instance: CIP30Instance
// ): Promise<BaseAddress> {
//   const addresses = await instance.getUsedAddresses();
//   const addr = BaseAddress.from_address(
//     Address.from_bytes(Uint8Array.from(Buffer.from(addresses[0], "hex")))
//   );
//   if (typeof addr !== "undefined") {
//     return addr;
//   }
//   throw new Error("addr is undefined");
// }

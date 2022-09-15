<script setup lang="ts">
import { VAceEditor } from "vue3-ace-editor";
import ace from "ace-builds";
import workerJsonUrl from "ace-builds/src-noconflict/mode-json";
import type { AssetDetail, BlockfrostUTXO, CIP30Instance, CIP30Provider, DatabaseUTXO, UTXO } from "@/types";
import { Buffer } from "buffer";
import { listMarketUtxos, getAssetDetail, getDatum } from "@/scripts/blockfrost";
import { decodeAssetName, callKuberAndSubmit, transformNftImageUrl, renderLovelace } from "@/scripts/wallet";
import * as database from "@/scripts/database"
import { market } from "@/config";
import { BaseAddress, Ed25519KeyHash, StakeCredential } from "@emurgo/cardano-serialization-lib-asmjs";
import { walletAction } from "@/scripts/sotre"
ace.config.setModuleUrl("ace/mode/json_worker", workerJsonUrl);
</script>

<template>
  <div>
    <div class=" ml-2">
      <div v-if="utxos.length==0" class="text-gray-400 font-semibold text-center my-5"> {{message}}</div>
      <div v-for="utxo in utxos" :key="utxo.tx_hash" class="p-2 flex">
        <img :alt="utxo.metadata.name +'_img'" class="inline-block h-32 w-32  mr-4 border-red-300 border-2"
          :src="utxo.metadata.image" />
        <div class="flex flex-col justify-between pb-2">
          <div>

            <div v-if="utxo.metadata.name">
              <a :href="'https://testnet.cardanoscan.io/token/'+utxo.nft"> &#x29c9; </a>

              <span class="text-blue-900 text-xl font-extrabol"> {{ utxo.metadata.name }} </span>
              <span v-if="utxo.metadata.artist"> <span class="text-gray-400 text-xs"> &nbsp; by {{
              utxo.metadata.artist }}</span> </span>
            </div>

            <div v-else class="text-blue-700 font-extrabold"> {{ utxo.nft?.substring(0, 8) }}...{{
            utxo.metadata.name
            }}
            </div>

            <div v-if="utxo.metadata.copyright || utxo.metadata.description">
              <div v-if="utxo.metadata.description" class="text-gray-500">
                {{ mapDescription(utxo.metadata.description) }}
              </div>
              <div v-if="utxo.metadata.copyright" class="text-gray-500"> Copyright:
                {{ utxo.metadata.copyright }}
              </div>
            </div>
          </div>
          <div>
            <button @click="buy(utxo)"
              class="bg-transparent hover:bg-blue-300 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-blue-200 rounded">
              {{
              renderLovelace(utxo.datum?.fields[1]?.int)
              }} Ada (Buy)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
async function makeDatabaseUtxo(nft: AssetDetail, u: BlockfrostUTXO): Promise<DatabaseUTXO> {
  const datum = await getDatum(u.data_hash);
  const md = { ...nft.onchain_metadata }
  const metadata = {
    artist: "artist" in md ? md.artist : "",
    copyright: "copyright" in md ? md.copyright : "",
    description: "description" in md ? md.description : "",
    image: "image" in md ? transformNftImageUrl(md.image) : "",
    name: "name" in md ? md.name : ""
  }
  return ({
    // utxo: u.id,
    datum: datum,
    data_hash: u.data_hash,
    metadata,
    nft: u.nft,
    tx_hash: u.tx_hash,
    tx_index: u.tx_index
  })
}
export default {
  async created() {
    try {
      // const _this = this
      // let db;
      const db: IDBDatabase = await database.openDB()
      const marketUtxos: BlockfrostUTXO[] = await listMarketUtxos()
      console.log("All Market utxos", marketUtxos)
      const utxos: BlockfrostUTXO[] = marketUtxos.reduce((utxos: BlockfrostUTXO[], utxo: BlockfrostUTXO) => {
        const amount_ = utxo.amount.filter(x => x.unit != 'lovelace')
        if (amount_.length == 1 && Number(amount_[0].quantity) == 1) {
          const nft: string = amount_[0].unit
          const policy = nft.substring(0, 56)
          const asset = nft.substring(56)
          const assetUtf8 = decodeAssetName(asset)
          utxo.policy = policy
          utxo.assetName = assetUtf8
          utxo.nft = nft
          utxo.id = utxo.tx_hash + '#' + utxo.tx_index
          return [...utxos, utxo]
        }
        return utxos
      }, [])
      const readHandle: IDBObjectStore = db && database.getReadHandle(db)
      const dbUtxos: PromiseSettledResult<DatabaseUTXO>[] = await Promise.allSettled(utxos.map(async (utxo: BlockfrostUTXO) => {
        try {
          return await database.getUtxo(readHandle, utxo.id);
        } catch (e) {
          console.log("Error returned from db", e);
          try {
            const nftDetail = await getAssetDetail(utxo.nft);
            const dbUtxo = await makeDatabaseUtxo(nftDetail, utxo)
            // console.log(nftDetail)
            // if (nftDetail.onchain_metadata) {
            //   if (nftDetail.onchain_metadata.name) {
            //     nftDetail._name = nftDetail.onchain_metadata.name;
            //   }
            //   if (nftDetail.onchain_metadata.image) {
            //     nftDetail._imageUrl = transformNftImageUrl(nftDetail.onchain_metadata.image);
            //   }
            // }
            setTimeout(() => {
              database.saveUtxos(db, [dbUtxo]);
            });
            return dbUtxo;
          } catch (e_1) {
            if (e_1.status_code && e_1.status_code == 404) {
              // const data_1 = {
              //   utxo: utxo.id,
              //   status_code: e_1.status_code
              // };
              // database.saveUtxos(db, [data_1]);
              // return data_1;
            } else {
              console.error(e_1);
              throw e_1;
            }
          }
        }
      }))
      // https://stackoverflow.com/questions/64928212/how-to-use-promise-allsettled-with-typescript
      const isRejected = (input: PromiseSettledResult<unknown>): input is PromiseRejectedResult =>
        input.status === "rejected"

      const isFulfilled = (input: PromiseSettledResult<any>): input is PromiseFulfilledResult<any> =>
        input.status === "fulfilled"

      const dbUtxosResponse: DatabaseUTXO[] = dbUtxos.filter(isFulfilled).map(p => p.value)
      dbUtxos.forEach(res => { if (isRejected(res)) console.log("rejected", res.reason) })
      // if (error) throw new Error(error)
      // const lookup = dbUtxosResponse.reduce((l, x) => {
      //   return (x.datum) ? { ...l, [x.tx_hash]: x } : l
      // }, {})
      // const validUtxos = utxos.reduce((us, u) => {
      //   return lookup[u.id] ? [...us, { ...u, detail: lookup[u.id] }] : us
      // }, [])
      // console.log("Valid market utxos", validUtxos)
      // this.utxos = validUtxos
      this.utxos = dbUtxosResponse
      if (dbUtxosResponse.length == 0) {
        this.message = "Marketplace is empty"
      }

    } catch (e) {
      if (e.status_code == 404) {
        this.message = "Marketplace is empty"
      } else {
        alert(e.message)
      }
    }
    ////////////////////////////////

    // return database.openDB().then((db: IDBDatabase) => {
    //   return listMarket().then((marketUtxos: UTXO[]) => {
    //     console.log("All Market utxos", marketUtxos)
    //     const utxos: UTXO[] = marketUtxos.filter((utxo: UTXO) => {
    //       const amount_ = utxo.amount.filter(x => x.unit !== 'lovelace')
    //       if (amount_.length == 1 && amount_[0].quantity == 1) {
    //         const nft: string = amount_[0].unit
    //         const policy = nft.substring(0, 56)
    //         const asset = nft.substring(56)
    //         const assetUtf8 = decodeAssetName(asset)
    //         utxo.policy = policy
    //         utxo.assetName = assetUtf8
    //         utxo.detail = {}
    //         utxo.nft = nft
    //         utxo.id = utxo.tx_hash + '#' + utxo.tx_index
    //         return true
    //       } else {
    //         return false
    //       }
    //     })
    //     const readHandle: IDBObjectStore = db && database.getReadHandle(db)
    //     return Promise.allSettled(utxos.map(async (utxo: UTXO) => {
    //       try {
    //         return await database.getUtxo(readHandle, utxo.id);
    //       } catch (e) {
    //         console.log("Error returned from db", e);
    //         try {
    //           const dataResponse = await getDatum(utxo.data_hash);
    //           utxo.datum = dataResponse.json_value;
    //           const nftDetail = await getAssetDetail(utxo.nft);
    //           if (nftDetail.onchain_metadata) {
    //             if (nftDetail.onchain_metadata.name) {
    //               nftDetail._name = nftDetail.onchain_metadata.name;
    //             }
    //             if (nftDetail.onchain_metadata.image) {
    //               nftDetail._imageUrl = transformNftImageUrl(nftDetail.onchain_metadata.image);
    //             }
    //           }
    //           nftDetail.utxo = utxo.id;
    //           nftDetail.datum = utxo.datum;
    //           setTimeout(() => {
    //             database.saveUtxos(db, [nftDetail]);
    //           });
    //           return nftDetail;
    //         } catch (e_1) {
    //           if (e_1.status_code && e_1.status_code == 404) {
    //             const data_1 = {
    //               utxo: utxo.id,
    //               status_code: e_1.status_code
    //             };
    //             database.saveUtxos(db, [data_1]);
    //             return data_1;
    //           } else {
    //             console.error(e_1);
    //             throw e_1;
    //           }
    //         }
    //       }
    //     })).then((xs: Array<any>) => {
    //       // const lookup = {}
    //       // xs.filter(x => x.value && x.value.datum).forEach(
    //       //   x => {
    //       //     lookup[x.value.utxo] = x.value
    //       //   })
    //       const lookup = xs.reduce((l, x) => {
    //         return (x.value && x.value.datum) ? { ...l, [x.value.utxo]: x.value } : l
    //       }, {})
    //       const validUtxos = utxos.reduce((us, u) => {
    //         return lookup[u.id] ? [...us, { ...u, detail: lookup[u.id] }] : us
    //       }, [])
    //       // utxos.forEach(u => u.detail = lookup[u.id])
    //       console.log("Valid market utxos", validUtxos)
    //       this.utxos = validUtxos
    //       if (validUtxos.length == 0) {
    //         this.message = "Marketplace is empty"
    //       }
    //     }
    //     )
    //   }).catch((e) => {
    //     if (e.status_code == 404) {
    //       this.message = "Marketplace is empty"
    //     } else {
    //       alert(e.message)
    //     }
    //   })
    // })
  },
  computed: {},
  data() {
    const providers: Array<CIP30Provider> = [];

    return {
      message: "Loading ...",
      hasIndexDb: false,
      utxos: [],
      providers: providers,
      addSelections: true,
      interval: 0,
      timeout: 0,
    };
  },
  methods: {
    mapDescription(desc: Array<string> | string) {
      return Array.isArray(desc) ? desc.join('') : desc
    },
    async buy(utxo: DatabaseUTXO) {
      console.log(utxo)
      const datum = utxo.datum
      const cost = datum.fields[1].int;
      const sellerPubKeyHashHex = datum.fields[0].fields[0].fields[0].bytes
      const sellerStakeKeyHashHex = datum.fields[0].fields[1].fields[0].bytes
      const vkey = StakeCredential.from_keyhash(Ed25519KeyHash.from_bytes(Buffer.from(sellerPubKeyHashHex, "hex")))
      const stakeKey = StakeCredential.from_keyhash(Ed25519KeyHash.from_bytes(Buffer.from(sellerStakeKeyHashHex, "hex")))
      const sellerAddr = BaseAddress.new(0, vkey, stakeKey)
      console.log("SellerAddr", sellerAddr.to_address().to_bech32())

      walletAction.callback = async (provider: CIP30Instance) => {
        const request = {
          selections: await provider.getUtxos(),
          inputs: [
            {
              address: market.address,
              utxo: {
                "hash": utxo.tx_hash,
                "index": utxo.tx_index
              },
              script: market.script,
              // value: `2A + ${nft.policy}.${nft.asset_name}`,
              datum: datum,
              redeemer: { fields: [], constructor: 0 },
            },
          ],
          outputs: [
            {
              address: sellerAddr.to_address().to_bech32("addr_test"),
              value: cost
            }
          ],
        };
        return callKuberAndSubmit(provider, JSON.stringify(request))
      }
      walletAction.enable = true
    },
    save(v: string) {
      localStorage.setItem("editor.content", v);
    },
  },
  components: {
    VAceEditor,
  },
};
</script>
<style>
@import "../assets/base.css";
</style>

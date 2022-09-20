<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import {
  decodeAssetName,
  listProviders,
  getWalletValue,
} from "@/scripts/wallet";
import type { CIP30Instance, CIP30Provider, KuberSellRequest, MultiAssetObj, PolicyId, TokenName, WalletBalance, WalletState, WalletValue } from "@/types";
import { getNftMetadata } from "@/scripts/blockfrost";
import { walletState, walletAction } from "@/scripts/store";
import { callKuberAndSubmit } from "@/scripts/wallet";
import { makePubKeyHash, makeStakeKeyHash, getUsedAddr } from "@/scripts/transaction"
import { market } from "@/config";
import { computed } from "vue";
import { useStore } from "vuex";
import MintForm from "./MintForm.vue"
import { ActionTypes } from "@/store/actions";

const store = useStore()
const providers = listProviders()
const balance: WalletBalance = {
  lovelace: BigInt(0),
  multiAssets: []
}
const provider = computed((): CIP30Provider => {
  return store.getters.getProvider;
})
const instance = computed((): CIP30Instance => {
  return store.getters.getInstance;
})
const sellAmount = ""
const walletPkh = instance.value ? makePubKeyHash(await getUsedAddr(instance.value)) : null
const displayBalance = computed((): number => {
    return parseFloat((balance.lovelace / BigInt(10000)).toString()) / 100;
  })
const shown = computed((): boolean => {
  return walletAction.enable || walletState.value;
})
function closeOverlay(): void {
  if (walletAction.enable) {
    walletAction.enable = false;
  } else {
    walletState.value = false;
  }
}
function showPriceInput(asset: MultiAssetObj, index: number) {
  asset.sellInput = true;
  // nextTick(() => {
  //   document.getElementById("sell-" + index)?.focus({ preventScroll: false });
  // });
}
function copyToClipboard(): void {
  if (walletPkh) {
    navigator.clipboard.writeText(walletPkh);
  }
}
async function sellNft(instance: CIP30Instance, asset: MultiAssetObj) {
  try {
    const sellerAddr = await getUsedAddr(instance);
    const sellerPkh = makePubKeyHash(sellerAddr);
    const sellerStakeKey = makeStakeKeyHash(sellerAddr);
    const request: KuberSellRequest = {
      selections: await instance.getUtxos(),
      outputs: [
        {
          address: market.address,
          value: `2A + 1 ${asset.policy}.${asset.tokenName}`,
          datum: {
            fields: [
              {
                fields: [
                  { fields: [{ bytes: `${sellerPkh}` }], constructor: 0 },
                  { fields: [{ bytes: `${sellerStakeKey}` }], constructor: 1 },
                ],
                constructor: 0,
              },
              { int: Math.round(parseFloat(sellAmount) * 1e6) },
            ],
            constructor: 0
          }
        }
      ]
    };
    callKuberAndSubmit(instance, request);
  }
  catch (e) {
  }
}
function renderLovelace(l: bigint): number {
  return parseFloat((l / BigInt(10000)).toString()) / 100;
}
async function connectProvider(provider: CIP30Provider) {
  await store.dispatch(ActionTypes.ConnectProvider, provider)
  const { lovelace, multiassets } = await computed(async (): Promise<WalletValue> => {
    return getWalletValue(instance.value);
  }).value
  balance.lovelace = lovelace;
  console.log(balance.lovelace)

  const maEntries: [PolicyId, {
    [key: TokenName]: bigint;
  }][] = Object.entries(multiassets)
  balance.multiAssets = await Promise.all(maEntries.flatMap(([policy, tokens]) => {
    const makeMultiAsset = async (policy: string, token: string): Promise<MultiAssetObj> => {
      const asset = policy + token
      const metadata = await getNftMetadata(asset)
      return ({ asset, metadata, policy, sellInput: false, tokenName: decodeAssetName(token) })
    }
    return Object.entries(tokens).reduce((acc: Promise<MultiAssetObj>[], [token, quantity]) => {
      return quantity === BigInt("1") ? [...acc, makeMultiAsset(policy, token)] : acc
    }, [])
  }))

}
async function disconnectProvider() {
  balance.lovelace = BigInt(0);
  balance.multiAssets = [];
  await store.dispatch(ActionTypes.DisconnectProvider)
}

</script>

<template>
  <!-- This example requires Tailwind CSS v2.0+ -->
  <TransitionRoot as="template" :show="shown">
    <Dialog as="div" class="relative z-10" @close="closeOverlay">
      <TransitionChild as="template" enter="ease-in-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
        leave="ease-in-out duration-300" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      </TransitionChild>
      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <TransitionChild as="template" enter="transform transition ease-in-out duration-300 sm:duration-400"
              enter-from="translate-x-full" enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-300 sm:duration-400" leave-from="translate-x-0"
              leave-to="translate-x-full">
              <DialogPanel class="pointer-events-auto relative w-screen max-w-md">
                <div class="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                  <div class="px-4 sm:px-6">
                    <div v-if="!walletAction.enable && provider" class="flex">
                      <img v-if="provider.icon" class="inline-block align-bottom w-16 h-16 mr-2" :src="provider.icon" />
                      <img v-else class="inline-block align-bottom w-12 h-12" src="/cardano.png" />
                      <span class="inline-block w-full">
                        <div class="text-3xl top-0 pb-1 font-bold text-blue-900">
                          {{ provider.name }}
                        </div>
                        <div v-if="walletPkh" class="flex items-center">
                          <span class="test-strong mr-2"> PubKeyHash </span>
                          <span class="text-blue-900 text-md mr-2">
                            {{ walletPkh.slice(0, 5) }}...{{
                            walletPkh.slice(walletPkh.length - 5)
                            }}
                          </span>
                          <img class="inline-block align-bottom w-5 h-5 cursor-pointer" @click="copyToClipboard()"
                            src="/clipboard.svg" />
                        </div>
                        <div class="align-bottom text-blue-900">
                          <div>{{ displayBalance }} Ada</div>

                        </div>

                      </span>
                      <button type="button" @click="disconnectProvider" class="float-right h-full">
                        <img class="inline text-red-600 h-4 w-4" src="/disconnect.svg" />
                      </button>
                    </div>
                    <DialogTitle v-else class="text-xl font-medium text-blue-900">
                      Connect Wallet
                    </DialogTitle>
                  </div>
                  <div v-if="instance">
                    <MintForm :cur-instance="instance" />
                  </div>
                  <div class="relative   sm:px-6">

                    <div v-if="walletAction.enable || !provider">
                      <div v-if="providers?.length == 0">
                        <div class="text-gray-600 font-semibold my-10 text-center">
                          Please Install cardano wallet plugin
                        </div>
                      </div>
                      <div class="flex mb-3" v-for="p in providers" :key="p.name">
                        <!-- <button @click="activate(provider)" -->
                        <button @click="connectProvider(p)"
                          class="flex-grow content-start text-left text-gray-600 text-xl focus:border-b-orange-400 focus:text-blue-700 hover:text-blue-700 focus:border-0 focus:m-0 focus:text-2xl">
                          <img v-if="p.icon" class="inline w-12 h-12 mr-2" :src="p.icon" />
                          <img v-else class="inline w-12 h-12 mr-2" src="/cardano.png" />
                          <span>{{ p.name }}</span>
                        </button>
                      </div>
                    </div>
                    <div v-else class="pt-3">
                      <div v-for="(asset, index) in balance.multiAssets" :key="index">
                        <img :alt="asset.tokenName + '_img'" v-if="asset.metadata.image" :src="asset.metadata.image" />
                        <div class="flex justify-between items-start">
                          <span v-if="asset.metadata.name" class="text-blue-900 text-xl font-extrabold pb-2">
                            {{ asset.metadata.name }}
                          </span>
                          <div v-else class="text-blue-700 font-extrabold">
                            {{ asset.policy.substring(0, 8) }}...{{ asset.tokenName }}
                          </div>
                          <div v-show="!asset.sellInput" class="text-blue-600 text-lg cursor-pointer"
                            @click="showPriceInput(asset, index)">
                            Sell
                          </div>
                        </div>

                        <div v-show="asset.sellInput">
                          <FormKit type="text" label="Sell Amount" name="sell-amount" placeholder="Sale Price (Ada)"
                            v-model="sellAmount" />
                          <!-- todo: add validation  https://formkit.com/essentials/validation  -->
                          <!-- <input :id="'sell-' + index" :value="sellAmount" @change="setInputValue"
                            class="w-full mb-2 rounded text-gray-800 py-2 px-3 border-2 border-gray-200 focus:outline-2 focus:outline-indigo-500"
                            placeholder="Sale Price (Ada)" /> -->
                          <div class="flex w-full justify-between gap-4">
                            <div
                              class="w-full border-2 border-indigo-500 cursor-pointer hover:bg-indigo-500 hover:text-white hover:border-indigo-600 active:ring-indigo-700 active:ring-offset-2 active:ring-2 rounded-xl p-2 text-center text-indigo-500"
                              @click="sellNft(instance, asset)">
                              Sell
                            </div>
                            <div
                              class="w-full border-2 border-red-500 cursor-pointer hover:bg-red-500 hover:text-white hover:border-red-600 active:ring-red-700 active:ring-offset-2 active:ring-2 rounded-xl p-2 text-center text-red-500"
                              @click="asset.sellInput = false">
                              Cancel
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<!-- <script lang="ts">

// export default defineComponent({
//   name: "Wallet",
//   data(): WalletState {
//     return {
//       prompt: "Connect Wallet",
//       providers: null,
//       curProvider: null,
//       walletPkh: null,
//       curInstance: null,
//       sellAmount: "",
//       showToast: false, // unused!
//       lastSalePrompt: 0, // unused!
//       balance: {
//         lovelace: BigInt(0),
//         multiAssets: [],
//       },
//     };
//   },
//   computed: {
//     displayBalance(): number {
//       return parseFloat((this.balance.lovelace / BigInt(10000)).toString()) / 100;
//     },
//     shown(): boolean {
//       return walletAction.enable || walletState.value;
//     },
//     instance(): CIP30Instance {
//       return this.$store.getters.getInstance;
//     }
//   },
//   mounted(): void {
//     // const handler: WatchCallback = (newVal, oldVal) => {
//     //   if (newVal !== oldVal) {
//     //     this.providers = listProviders();
//     //     unWatch();
//     //   }
//     // };
//     const unWatch: WatchStopHandle = this.$watch("shown", (newVal: boolean, oldVal: boolean) => {
//       if (newVal !== oldVal) {
//         this.providers = listProviders();
//         unWatch();
//       }
//     });
//   },
//   methods: {
//     closeOverlay() {
//       if (walletAction.enable) {
//         walletAction.enable = false;
//       } else {
//         walletState.value = false;
//       }
//     },
//     showPriceInput(asset: MultiAssetObj, index: number) {
//       asset.sellInput = true;
//       this.$nextTick(() => {
//         document.getElementById("sell-" + index)?.focus({ preventScroll: false });
//       });
//     },
//     copyToClipboard(): void {
//       if (this.walletPkh) {
//         navigator.clipboard.writeText(this.walletPkh);
//       }
//     },
//     async sellNft(instance: CIP30Instance, asset: MultiAssetObj) {
//       // const addresses = await instance.getUsedAddresses();
//       // const sellerAddr = BaseAddress.from_address(
//       //   Address.from_bytes(Uint8Array.from(Buffer.from(addresses[0], "hex")))
//       // );
//       // console.log("sellerAddr", sellerAddr);
//       // if (typeof sellerAddr !== "undefined") {
//       try {
//         const sellerAddr = await getUsedAddr(instance);
//         const sellerPkh = makePubKeyHash(sellerAddr);
//         const sellerStakeKey = makeStakeKeyHash(sellerAddr);
//         const request: KuberSellRequest = {
//           selections: await instance.getUtxos(),
//           outputs: [
//             {
//               address: market.address,
//               value: `2A + 1 ${asset.policy}.${asset.tokenName}`,
//               datum: {
//                 fields: [
//                   {
//                     fields: [
//                       { fields: [{ bytes: `${sellerPkh}` }], constructor: 0 },
//                       { fields: [{ bytes: `${sellerStakeKey}` }], constructor: 1 },
//                     ],
//                     constructor: 0,
//                   },
//                   { int: Math.round(parseFloat(this.sellAmount) * 1e6) },
//                 ],
//                 constructor: 0
//               }
//             }
//           ]
//         };
//         callKuberAndSubmit(instance, request);
//       }
//       catch (e) {
//       }
//     },
//     // setInputValue(event: any) {
//     //   this.sellAmount = event?.target?.value;
//     // },
//     renderLovelace(l: bigint): number {
//       return parseFloat((l / BigInt(10000)).toString()) / 100;
//     },
//     async activate(provider: CIP30Provider): Promise<void> {
//       if (walletAction.enable && walletAction.callback) {
//         walletAction.enable = false;
//         console.log("calling", walletAction.callback);
//         return walletAction.callback(await provider.enable())?.catch?.((e) => {
//           alert("Error" + e.message);
//         });
//       }
//       this.curProvider = provider;
//       const instance = await provider.enable();
//       store.commit("setInstance", instance);
//       this.walletPkh = makePubKeyHash(await getUsedAddr(instance));
//       const { lovelace, multiassets } = await getWalletValue(instance);
//       this.balance.lovelace = lovelace;
//       // resume here...

//       const makeMultiAsset = async (policy: string, token: string): Promise<MultiAssetObj> => {
//         const asset = policy + token
//         const metadata = await getNftMetadata(asset)
//         return ({ asset, metadata, policy, sellInput: false, tokenName: decodeAssetName(token) })
//       }

//       const maEntries: [PolicyId, {
//         [key: TokenName]: bigint;
//       }][] = Object.entries(multiassets)
//       this.balance.multiAssets = await Promise.all(maEntries.flatMap(([policy, tokens]) => {
//         return Object.entries(tokens).reduce((acc: Promise<MultiAssetObj>[], [token, quantity]) => {
//           return quantity === BigInt("1") ? [...acc, makeMultiAsset(policy, token)] : acc
//         }, [])
//       }))
//       // return this.balance.multiAssets;

//       // return provider.enable().then(async (instance: CIP30Instance) => {
//       //   this.curInstance = instance;
//       //   this.walletPkh = await renderPubKeyHash(instance);
//       //   return getWalletValue(instance).then((val) => {
//       //     console.log("Wallet balance", val)
//       //     const assetList: Array<any> = [];
//       //     for (let policy in val.multiassets) {
//       //       const tokens = val.multiassets[policy];
//       //       for (let token in tokens) {
//       //         console.log(policy, token, tokens[token]);
//       //         if (tokens[token] == 1) {
//       //           assetList.push({
//       //             tokenName: decodeAssetName(token),
//       //             policy: policy,
//       //             asset: policy + token,
//       //           });
//       //         }
//       //       }
//       //     }
//       //     this.balance.lovelace = val.lovelace;
//       //     this.balance.multiAssets = assetList;
//       // return Promise.all(
//       //   this.balance.multiAssets.map(async (v) => {
//       //     const nft_1 = await getNftMetadata(v.asset);
//       //     v.name = nft_1.name;
//       //     v.image = nft_1.image;
//       //   })
//       // );

//       //this.balance.multiAssets[i]=v
//       //   });
//       // });
//     },
//     disconnectProvider() {
//       this.balance.lovelace = BigInt(0);
//       this.balance.multiAssets = [];
//       this.curProvider = null;
//       this.curInstance = null;
//     },
//   },
// });
</script> -->

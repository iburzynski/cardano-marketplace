<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from "@headlessui/vue";
import {
  decodeAssetName,
  listProviders,
  getWalletValue,
} from "@/scripts/wallet";
import type { CIP30Instance, CIP30Provider, MultiAssetObj, NftMetadata, PolicyId, TokenName, WalletValue } from "@/types";
import { getNftMetadata } from "@/scripts/blockfrost";
import { makePubKeyHash, getUsedAddr } from "@/scripts/transaction"
import { computed, reactive, type ComputedRef } from "vue";
import { useStore } from "vuex";
import MintForm from "./MintForm.vue"
import WalletAsset from "./WalletAsset.vue"
import { ActionTypes } from "@/store/actions";
import { MutationType } from "@/store/mutations";
import { XMarkIcon } from "@heroicons/vue/24/outline"

const store = useStore()
const isWalletShown: ComputedRef<boolean> = computed((): boolean => {
  return store.getters.getShow
})
const providers: CIP30Provider[] = listProviders()
const balance: { lovelace: bigint, multiAssets: MultiAssetObj[] } = reactive({
  lovelace: BigInt(0),
  multiAssets: []
})
const provider = computed((): CIP30Provider => {
  return store.getters.getProvider;
})
const instance = computed((): CIP30Instance => {
  return store.getters.getInstance;
})
const walletPkh = instance.value ? makePubKeyHash(await getUsedAddr(instance.value)) : null
const displayAdaBalance = computed((): number => {
  return parseFloat((balance.lovelace / BigInt(10000)).toString()) / 100;
})
function closeOverlay(): void {
  store.commit(MutationType.ToggleWallet)
}
function copyToClipboard(): void {
  if (walletPkh) {
    navigator.clipboard.writeText(walletPkh);
  }
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
      const asset: string = policy + token
      const metadata: NftMetadata = await getNftMetadata(asset)
      return ({ asset, metadata, policy, tokenName: decodeAssetName(token) })
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
  <!-- https://tailwindui.com/components/application-ui/overlays/slide-overs -->
  <TransitionRoot as="template" :show="isWalletShown">
    <Dialog as="div" class="relative z-10" @close.once="closeOverlay">
      <TransitionChild as="template" enter="ease-in-out duration-500" enter-from="opacity-0" enter-to="opacity-100"
        leave="ease-in-out duration-500" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      </TransitionChild>
      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <TransitionChild as="template" enter="transform transition ease-in-out duration-500 sm:duration-700"
              enter-from="translate-x-full" enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-700" leave-from="translate-x-0"
              leave-to="translate-x-full">
              <DialogPanel class="pointer-events-auto relative w-screen max-w-md">
                <TransitionChild as="template" enter="ease-in-out duration-500" enter-from="opacity-0"
                  enter-to="opacity-100" leave="ease-in-out duration-500" leave-from="opacity-100" leave-to="opacity-0">
                  <div class="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
                    <button type="button"
                      class="rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                      @click="closeOverlay">
                      <span class="sr-only">Close panel</span>
                      <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </TransitionChild>
                <div class="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                  <div class="px-4 sm:px-6">
                    <DialogTitle class="text-lg font-medium text-gray-900">Panel title</DialogTitle>
                  </div>
                  <div class="relative mt-6 flex-1 px-4 sm:px-6">
                    <div v-if="!provider">
                      <DialogTitle>Connect Wallet</DialogTitle>
                      <div v-if="providers?.length == 0">
                        <div class="text-gray-600 font-semibold my-10 text-center">
                          Please Install a Cardano Wallet Plugin
                        </div>
                      </div>
                      <div v-else>
                        <div class="flex mb-3" v-for="p in providers" :key="p.name">
                          <button @click="connectProvider(p)"
                            class="flex-grow content-start text-left text-gray-600 text-xl focus:border-b-orange-400 focus:text-blue-700 hover:text-blue-700 focus:border-0 focus:m-0 focus:text-2xl">
                            <img v-if="p.icon" class="inline w-12 h-12 mr-2" :src="p.icon" />
                            <img v-else class="inline w-12 h-12 mr-2" src="/cardano.png" />
                            <span>{{ p.name }}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div v-else>
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
                          <div>{{ displayAdaBalance }} Ada</div>
                        </div>
                      </span>
                      <button type="button" @click="disconnectProvider" class="float-right h-full">
                        <img class="inline text-red-600 h-4 w-4" src="/disconnect.svg" />
                      </button>
                      <div v-if="instance">
                        <MintForm :instance="instance" />
                      </div>
                      <template v-for="(asset, index) in balance.multiAssets" :key="index">
                        <WalletAsset :instance="instance" :asset="asset" />
                      </template>
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
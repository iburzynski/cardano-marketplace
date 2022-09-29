<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from "@headlessui/vue";
import {
  listProviders,
  getWalletValue,
  makeMultiAssetObj,
} from "@/utils/wallet";
import type { CIP30Instance, CIP30Provider, MultiAssetObj, PolicyId, TokenName, UserKeyhashes, WalletValue } from "@/types";
import { getUserKeyhashes } from "@/utils/transaction"
import { computed, reactive, ref, type ComputedRef, type Ref } from "vue";
import { useStore } from "vuex";
import MintForm from "./MintForm.vue"
import WalletAsset from "./WalletAsset.vue"
import { ActionTypes } from "@/store/actions";
import { MutationType } from "@/store/mutations";
import { XMarkIcon } from "@heroicons/vue/24/outline"

const store = useStore()
const isWalletShown: ComputedRef<boolean> = computed((): boolean => store.getters.getShow)
const providers: CIP30Provider[] = listProviders()
const currentProvider: Ref<null | CIP30Provider> = ref(null)
const instance = computed((): CIP30Instance => {
  return store.getters.getInstance;
});
const utxos = computed((): string[] => {
  return store.getters.getUtxos
});
const balance: { lovelace: bigint, multiAssets: MultiAssetObj[] } = reactive({
  lovelace: BigInt(0),
  multiAssets: []
})
const userKeyhashes: Ref<null | UserKeyhashes> = ref(null)
const pubKeyhash = computed(() => {
  return userKeyhashes.value ? userKeyhashes.value.pubKeyhash : null;
})
const displayedKeyhash = computed(() => {
  return pubKeyhash.value ? pubKeyhash.value.slice(0, 5) + "..." + pubKeyhash.value.slice(pubKeyhash.value.length - 5) : ""
});

const displayAdaBalance = computed((): number => {
  return parseFloat((balance.lovelace / BigInt(10000)).toString()) / 100;
})
function closeOverlay(): void { store.commit(MutationType.ToggleWallet) }

async function connectProvider(provider: CIP30Provider) {
  await store.dispatch(ActionTypes.ConnectProvider, provider)
  currentProvider.value = provider
  userKeyhashes.value = await getUserKeyhashes(instance.value)
  const { lovelace, multiassets } = getWalletValue(utxos.value);
  balance.lovelace = lovelace;
  // populate balance multiassets
  const maEntries: [PolicyId, {
    [key: TokenName]: bigint;
  }][] = Object.entries(multiassets)
  // make flat array of multiasset object promises for all policies and resolve
  balance.multiAssets = await Promise.all(maEntries.flatMap(([policy, tokens]) => {
    // convert token array to array of multiasset objects
    return Object.entries(tokens).reduce((acc: Promise<MultiAssetObj>[], [token, quantity]) => {
      // add asset object to the accumulator if it's an NFT
      return quantity === BigInt("1") ? [...acc, makeMultiAssetObj(policy, token)] : acc
    }, [])
  }))
}
async function disconnectProvider() {
  currentProvider.value = null;
  balance.lovelace = BigInt(0);
  balance.multiAssets = [];
  // set instance to `null` in store
  await store.dispatch(ActionTypes.DisconnectProvider)
}
async function copyToClipboard(): Promise<void> {
  if (pubKeyhash.value) {
    navigator.clipboard.writeText(pubKeyhash.value);
  }
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
                    <div v-if="!instance">
                      <DialogTitle>Connect Wallet</DialogTitle>
                      <div v-if="providers?.length == 0">
                        <div class="text-gray-600 font-semibold my-10 text-center">
                          Please Install a Cardano Wallet Plugin
                        </div>
                      </div>
                      <div v-else>
                        <div class="flex mb-3" v-for="provider in providers" :key="provider.name">
                          <button @click="connectProvider(provider)"
                            class="flex-grow content-start text-left text-gray-600 text-xl focus:border-b-orange-400 focus:text-blue-700 hover:text-blue-700 focus:border-0 focus:m-0 focus:text-2xl">
                            <img v-if="provider.icon" class="inline w-12 h-12 mr-2" :src="provider.icon" />
                            <img v-else class="inline w-12 h-12 mr-2" src="/cardano.png" />
                            <span>{{ provider.name }}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div v-else-if="currentProvider">
                      <img v-if="currentProvider.icon" class="inline-block align-bottom w-16 h-16 mr-2"
                        :src="currentProvider.icon" />
                      <img v-else class="inline-block align-bottom w-12 h-12" src="/cardano.png" />
                      <span class="inline-block w-full">
                        <div class="text-3xl top-0 pb-1 font-bold text-blue-900">
                          {{ currentProvider.name }}
                        </div>
                        <div v-if="displayedKeyhash" class="flex items-center">
                          <span class="test-strong mr-2"> PubKeyHash </span>
                          <span class="text-blue-900 text-md mr-2">
                            {{ displayedKeyhash }}
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
                      <div class="mint-form" v-if="instance">
                        <MintForm :instance="instance" :selections="utxos" />
                      </div>
                      <div class="wallet-assets">
                        <template v-for="(asset, index) in balance.multiAssets" :key="index">
                          <WalletAsset :asset="asset" :instance="instance" :selections="utxos"
                            :userKeyhashes="userKeyhashes" />
                        </template>
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
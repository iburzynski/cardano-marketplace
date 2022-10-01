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
import type {
  CIP30Instance,
  CIP30Provider,
  KuberMintRequest,
  KuberSellRequest,
  MultiAssetObj,
  NftMetadata,
  PolicyId,
  TokenName,
  UserKeyhashes
} from "@/types";
import {
  buildMintRequest,
  buildSellRequest,
  submitToKuber,
  getUserKeyhashes
} from "@/utils/transaction"
import { computed, reactive, ref, watch, type Ref } from "vue";
import MintForm from "./MintForm.vue"
import WalletAsset from "./WalletAsset.vue"
import { ClipboardDocumentIcon, PhotoIcon, WalletIcon, XMarkIcon } from "@heroicons/vue/24/outline"

const props: Readonly<{
  instance?: CIP30Instance;
  walletShown?: boolean;
  walletUtxos?: string[];
}> = defineProps(['instance', 'walletShown', 'walletUtxos'])
const emit = defineEmits<{
  (e: 'closeWallet'): void
  (e: 'connectProvider', provider: CIP30Provider): void
  (e: 'disconnectProvider'): void
}>()

console.log(window.cardano)
const providers: CIP30Provider[] = listProviders()
const currentProvider: Ref<null | CIP30Provider> = ref(null)

const userKeyhashes: Ref<null | UserKeyhashes> = ref(null)
const pubKeyhash = computed(() => {
  return userKeyhashes.value ? userKeyhashes.value.pubKeyhash : null;
})
const displayedKeyhash = computed(() => {
  return pubKeyhash.value ? pubKeyhash.value.slice(0, 5) + "..." + pubKeyhash.value.slice(pubKeyhash.value.length - 5) : ""
});
// Update keyhashes if instance changes
watch(() => props.instance, async (newInstance): Promise<void> => {
  userKeyhashes.value = newInstance ? await getUserKeyhashes(newInstance) : null
})

// Wallet Balance:
const balance: { lovelace: bigint, multiAssets: MultiAssetObj[] } = reactive({
  lovelace: BigInt(0),
  multiAssets: []
})
watch(() => props.walletUtxos, async (val) => {
  if (typeof val !== "undefined") {
    const { lovelace, multiassets } = getWalletValue(val)
    balance.lovelace = lovelace
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
})
const displayAdaBalance = computed((): number => {
  return parseFloat((balance.lovelace / BigInt(10000)).toString()) / 100;
})

const isFormShown: Ref<boolean> = ref(false)

function closeWallet(): void {
  isFormShown.value = false
  emit("closeWallet")
}

async function connectProvider(provider: CIP30Provider) {
  currentProvider.value = provider
  emit("connectProvider", provider)
}
async function disconnectProvider() {
  currentProvider.value = null;
  balance.lovelace = BigInt(0);
  balance.multiAssets = [];
  emit("disconnectProvider")
}
async function copyToClipboard(): Promise<void> {
  if (pubKeyhash.value) {
    navigator.clipboard.writeText(pubKeyhash.value);
  }
}

function toggleForm() {
  isFormShown.value = isFormShown.value ? false : true
}

async function mint(metadata: NftMetadata): Promise<void> {
  const { instance, walletUtxos } = props
  try {
    if (instance) {
      if (walletUtxos) {
        console.log(metadata);
        if (userKeyhashes.value) {
          const { pubKeyhash }: UserKeyhashes = userKeyhashes.value
          const request: KuberMintRequest = await buildMintRequest(walletUtxos, pubKeyhash, metadata)
          await submitToKuber(instance, request);
        } else {
          throw new Error("Undefined userKeyhashes")
        }
      } else {
        throw new Error("Undefined selections")
      }
    } else {
      throw new Error("Undefined instance");
    }
  } catch (e) {
    console.error(e);
    alert(e);
  };
}

async function sell(asset: MultiAssetObj, sellAmount: number): Promise<void> {
  const { instance, walletUtxos } = props
  try {
    if (typeof instance !== "undefined" && userKeyhashes.value && typeof walletUtxos !== "undefined") {
      const request: KuberSellRequest = await buildSellRequest(asset, walletUtxos, sellAmount, userKeyhashes.value)
      submitToKuber(instance, request);
    } else {
      throw new Error("Undefined prop value")
    }

  }
  catch (e) {
    console.log(e)
  }
}

</script>

<template>
  <!-- https://tailwindui.com/components/application-ui/overlays/slide-overs -->
  <TransitionRoot as="template" :show=walletShown>
    <Dialog as="div" class="relative z-10" @close="closeWallet">
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
                      @click="closeWallet">
                      <span class="sr-only">Close Wallet</span>
                      <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </TransitionChild>
                <div class="flex h-full flex-col overflow-y-scroll bg-gray-800 p-4 shadow-xl">
                  <div class="px-4 sm:px-6">
                    <DialogTitle class="text-2xl font-semibold text-red-400">
                      <WalletIcon class="inline h-12 mr-4" /><span v-if="!instance">Connect </span>Wallet
                    </DialogTitle>
                  </div>
                  <div class="relative mt-6 flex-1 px-4 sm:px-6">
                    <div v-if="!instance">
                      <div v-if="providers?.length == 0">
                        <div class="text-gray-600 font-semibold my-10 text-center">
                          Please Install a Cardano Wallet Plugin
                        </div>
                      </div>
                      <div v-else>
                        <div class="flex mb-3" v-for="provider in providers" :key="provider.name">
                          <button @click="connectProvider(provider)"
                            class="flex-grow content-start text-left text-orange-400 text-xl focus:border-b-orange-400 focus:text-white hover:text-white focus:border-0 focus:m-0 focus:text-2xl">
                            <img v-if="provider.icon" class="inline w-12 h-12 mr-2" :src="provider.icon" />
                            <img v-else class="inline w-12 h-12 mr-2" src="/cardano.png" />
                            <span>{{ provider.name }}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div v-else-if="currentProvider" class="flex flex-col space-y-6 bg-sky-900 rounded-md p-4">
                      <div class="flex"><img v-if="currentProvider.icon" class="align-bottom w-16 h-16 mr-2"
                          :src="currentProvider.icon" />
                        <img v-else class="align-bottom w-12 h-12" src="/cardano.png" />
                        <div class="flex flex-col w-full">
                          <div class="flex justify-between">
                            <h3 class="text-xl top-0 pb-1 font-bold text-gray-400">
                              {{ currentProvider.name }}
                            </h3>
                            <button type="button" @click="disconnectProvider" class="float-right h-full">
                              <img class="inline text-red-400 h-4 w-4" src="/disconnect.svg" />
                            </button>
                          </div>
                          <div v-if="displayedKeyhash" class="flex text-gray-200 justify-between">
                            <small class="text-xs">PubKeyhash: {{ displayedKeyhash }}</small>
                            <ClipboardDocumentIcon class="align-bottom w-4 h-4 cursor-pointer"
                              @click="copyToClipboard()" src="/clipboard.svg" />
                          </div>
                        </div>
                      </div>
                      <div class="flex justify-between items-center">
                        <h4 class="text-yellow-400 text-xl text-right font-semibold"><span class="text-2xl">₳</span> {{
                        displayAdaBalance }}</h4>
                        <button @click="toggleForm" class="bg-green-400 hover:bg-yellow-400 p-2 rounded-lg">
                          <PhotoIcon class="h-6 mr-2 inline" /> Mint NFT
                        </button>
                      </div>
                      <div class="mint-form" v-show="isFormShown">
                        <MintForm @hide-form="toggleForm" @mint="mint" />
                      </div>
                      <div class="wallet-assets flex flex-col space-y-6 justify-center">
                        <h3 class="text-lg text-yellow-400 font-semibold">Assets</h3>
                        <template v-for="(asset, index) in balance.multiAssets" :key="index">
                          <WalletAsset :asset="asset" @sell="sell" />
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
<script setup lang="ts">
import Navbar from "./components/Navbar.vue"
import Wallet from "./components/Wallet.vue"
import MarketAsset from "./components/MarketAsset.vue"
import Footer from "./components/Footer.vue"
import { ref, type Ref } from "vue";
import type { CIP30Instance, CIP30Provider, DbUTXO, KuberBuyRequest } from "./types";
import { listMarketUtxos } from "./utils/blockfrost";
import { convertUtxos } from "./utils/database";
import { buildBuyRequest, submitToKuber } from "./utils/transaction";

const walletShown: Ref<boolean> = ref(false)
const instance: Ref<null | CIP30Instance> = ref(null)
const connected: Ref<boolean> = ref(false)
const marketUtxos: Ref<DbUTXO[]> = ref([])
const walletUtxos: Ref<string[]> = ref([])

const refreshRate: number = 5000
getMarketUtxos()

function open() {
  walletShown.value = true
}

function close() {
  walletShown.value = false
}

async function getWalletUtxos(instance: CIP30Instance) {
  walletUtxos.value = await instance.getUtxos()
}

async function connect(provider: CIP30Provider) {
  const newInstance = await provider.enable()
  connected.value = true
  instance.value = newInstance
  await getWalletUtxos(newInstance)
}

async function disconnect() {
  connected.value = false
  instance.value = null
  walletUtxos.value = []
}

async function getMarketUtxos(): Promise<void> {
  marketUtxos.value = await convertUtxos(await listMarketUtxos())
}

async function buy(asset: DbUTXO): Promise<any> {
  if (instance.value) {
    if (walletUtxos.value.length > 0) {
      const request: KuberBuyRequest = buildBuyRequest(walletUtxos.value, asset)
      return submitToKuber(instance.value, request);
    } else {
      throw new Error("Empty walletUtxos")
    }
  } else {
    throw new Error("No connected instance")
  }
}

async function refreshAllUtxos() {
  setTimeout(async () => {
    if (instance.value) {
      await getWalletUtxos(instance.value)
    }
    await getMarketUtxos()
  }, refreshRate)
}
function logWallets() {
  console.log(window.cardano)
}
</script>

<template>
  <div class="bg-sky-900 bg-opacity-75 min-h-screen flex flex-col justify-between font-mono text-md">
    <Navbar @open-wallet="open" />
    <main class="nfts max-w-7xl p-8 mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="marketUtxos.length==0" class="nfts__empty text-gray-400 font-semibold text-center my-5"> Marketplace is
        empty
      </div>
      <template v-for="utxo in marketUtxos" :key="utxo.tx_hash">
        <MarketAsset :connected="connected" :asset="utxo" @open-wallet="open" @buy="buy" />
      </template>
    </main>
    <Wallet :instance="instance" :wallet-shown="walletShown" :wallet-utxos="walletUtxos" @connect-provider="connect"
      @disconnect-provider="disconnect" @close-wallet="close" />
    <Footer />
  </div>
</template>

<style>
  body {
    background: url('src/assets/galaga-bg.jpg')
}
</style>
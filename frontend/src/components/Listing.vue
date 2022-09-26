<script setup lang="ts">
import type { BfUTXO, CIP30Instance } from "@/types";
import { listMarketUtxos } from "@/scripts/blockfrost";
import { convertUtxos } from "@/scripts/database";
import { useStore } from "vuex";
import { computed } from "vue";
import MarketAsset from "./MarketAsset.vue"

const store = useStore()
const instance = computed((): CIP30Instance => {
  return store.getters.getInstance;
})
const marketUtxos: BfUTXO[] = await listMarketUtxos()
const utxos = await convertUtxos(marketUtxos)
</script>

<template>
  <div class="nfts ml-2">
    <div v-if="utxos.length==0" class="nfts__empty text-gray-400 font-semibold text-center my-5"> Marketplace is empty
    </div>
    <template v-for="utxo in utxos" :key="utxo.tx_hash">
      <MarketAsset :instance="instance" :utxo="utxo"/>
    </template>
  </div>
</template>

<style>
@import "../assets/base.css";
</style>

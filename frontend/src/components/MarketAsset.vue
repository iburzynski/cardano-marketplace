<script setup lang="ts">
import type { DbUTXO } from '@/types';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

const props: Readonly<{
  asset?: DbUTXO;
  connected?: boolean;
}> = defineProps(['asset', 'connected'])

const emit = defineEmits<{
  (e: 'buy', asset: DbUTXO): void
  (e: 'openWallet'): void
}>()

const adaPrice: ComputedRef<number> = computed(() => {
  const lovelace = props.asset &&
    "fields" in props.asset.datum
    && "int" in props.asset.datum.fields[1] ?
    props.asset.datum.fields[1].int : NaN
  return typeof lovelace === "number" ?
    Math.floor(lovelace / 1e4) / 100 :
    parseFloat((lovelace / BigInt(10000)).toString()) / 100
})

const imgSrc: Ref<string> = ref(props.asset ? props.asset.metadata.image : "")

// Event Handlers (trigger corresponding upstream handlers via emits)
function buyAsset(): void {
  (typeof props.asset !== "undefined") && emit("buy", props.asset)
}

function openWallet(): void {
  emit('openWallet')
}

function setAltImg() {
  imgSrc.value = "./src/assets/cardano_logo.svg"
}

</script>

<template>
  <div class="nft p-4 flex bg-white bg-opacity-75 rounded-lg shadow-xl">
    <img :alt="asset.metadata.name +'_img'" class="inline-block w-1/2"
      :src="imgSrc"
      @error="setAltImg"/>
    <div class="nft__inset flex flex-col justify-between w-1/2 p-6">
      <div class="nft__metadata">
        <div v-if="asset.metadata.name" class="nft__metadata__name">
          <a :href="'https://testnet.cardanoscan.io/token/'+asset.nft"> &#x29c9; </a>
          <span class="text-blue-900 text-xl font-extrabol"> {{ asset.metadata.name }} </span>
          <span v-if="asset.metadata.artist" class="nft__metadata__artist"> <span class="text-gray-400 text-xs">
              &nbsp; by {{
              asset.metadata.artist }}</span> </span>
        </div> <!-- /name -->
        <div v-else class="nft__metadata__name text-blue-700 font-extrabold"> {{ asset.nft?.substring(0, 8) }}...{{
        asset.metadata.name
        }}
        </div> <!-- /name -->
        <div v-if="asset.metadata.copyright || asset.metadata.description" class="nft__metadata__extra">
          <div v-if="asset.metadata.description" class="nft__metadata__description text-gray-500">
            {{ asset.metadata.description }}
          </div> <!-- /description -->
          <div v-if="asset.metadata.copyright" class="nft__metadata__copyright text-gray-500"> Copyright:
            {{ asset.metadata.copyright }}
          </div> <!-- /copyright -->
        </div> <!-- /extra -->
      </div> <!-- /metadata -->
      <h3 class="text-2xl font-bold">₳ {{ adaPrice }}</h3>
      <button @click="connected ? buyAsset() : openWallet()"
        class="bg-teal-500 hover:bg-yellow-200 text-gray-800 font-semibold py-2 px-4 rounded-xl text-xl font-display">
        Buy
      </button>
    </div> <!-- /inset -->
  </div>
</template>
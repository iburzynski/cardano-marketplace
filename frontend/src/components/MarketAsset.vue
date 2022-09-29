<script setup lang="ts">
import type { CIP30Instance, DbUTXO } from '@/types';
import { computed } from 'vue';
import { useStore } from 'vuex';
import { MutationType } from '@/store/mutations';
import { callKuberAndSubmit, buildBuyRequest } from '@/utils/transaction';

const { instance, selections, utxo }: Readonly<{
  instance?: CIP30Instance;
  selections?: string[];
  utxo?: DbUTXO;
}> = defineProps(['instance', 'selections', 'utxo'])
const store = useStore()
function toggleWallet() {
  store.commit(MutationType.ToggleWallet)
}
const adaPrice = computed(() => {
  return lovelaceToAda(utxo && "fields" in utxo.datum && "int" in utxo.datum.fields[1] ? utxo.datum.fields[1].int : NaN)
})

function lovelaceToAda(l: bigint | number): bigint | number {
  if (typeof l === "number") {
    return Math.floor(l / 1e4) / 100;
  }
  return l && parseFloat((l / BigInt(10000)).toString()) / 100;
}

async function buyAsset(): Promise<any> {
  if (instance) {
    if (selections) {
      if (utxo) {
        return callKuberAndSubmit(instance, buildBuyRequest(selections, utxo));
      } else {
        throw new Error("Undefined utxo")
      }
    } else {
      throw new Error("Undefined selections")
    }
  } else {
    throw new Error("Undefined instance")
  }
}
</script>

<template>
  <div class="nft p-2 flex">
    <img :alt="utxo.metadata.name +'_img'" class="inline-block h-32 w-32  mr-4 border-red-300 border-2"
      :src="utxo.metadata.image" />
    <div class="nft__inset flex flex-col justify-between pb-2">
      <div class="nft__metadata">
        <div v-if="utxo.metadata.name" class="nft__metadata__name">
          <a :href="'https://testnet.cardanoscan.io/token/'+utxo.nft"> &#x29c9; </a>
          <span class="text-blue-900 text-xl font-extrabol"> {{ utxo.metadata.name }} </span>
          <span v-if="utxo.metadata.artist" class="nft__metadata__artist"> <span class="text-gray-400 text-xs">
              &nbsp; by {{
              utxo.metadata.artist }}</span> </span>
        </div> <!-- /name -->
        <div v-else class="nft__metadata__name text-blue-700 font-extrabold"> {{ utxo.nft?.substring(0, 8) }}...{{
        utxo.metadata.name
        }}
        </div> <!-- /name -->
        <div v-if="utxo.metadata.copyright || utxo.metadata.description" class="nft__metadata__extra">
          <div v-if="utxo.metadata.description" class="nft__metadata__description text-gray-500">
            {{ utxo.metadata.description }}
          </div> <!-- /description -->
          <div v-if="utxo.metadata.copyright" class="nft__metadata__copyright text-gray-500"> Copyright:
            {{ utxo.metadata.copyright }}
          </div> <!-- /copyright -->
        </div> <!-- /extra -->
      </div> <!-- /metadata -->
      <button @click="instance ? buyAsset() : toggleWallet()"
        class="bg-transparent hover:bg-blue-300 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-blue-200 rounded">
        {{ adaPrice }} Ada (Buy)
      </button>
    </div> <!-- /inset -->
  </div>
</template>
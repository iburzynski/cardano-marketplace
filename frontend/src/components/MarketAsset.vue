<script setup lang="ts">
import { market } from '@/config';
import { genSellerAddr } from '@/scripts/transaction';
import { callKuberAndSubmit, renderLovelace } from '@/scripts/wallet';
import { MutationType } from '@/store/mutations';
import type { CIP30Instance, DbUTXO, KuberBuyRequest } from '@/types';
import { useStore } from 'vuex';

const { instance, utxo }: Readonly<{
  instance?: CIP30Instance;
  utxo?: DbUTXO;
}> = defineProps(['instance', 'utxo'])
const store = useStore()
function toggleWallet() {
  store.commit(MutationType.ToggleWallet)
}
async function buyAsset(): Promise<any> {
  if (typeof instance !== "undefined" && typeof utxo !== "undefined") {
    const datum = utxo.datum;
    // validation required to ensure datum is correctly structured:
    const value =
      "fields" in datum && datum.fields[1] && "int" in datum.fields[1]
        ? datum.fields[1].int.toString()
        : null; // what should go here if validation fails?
    if (value) {
      const { address, script } = market;
      const request: KuberBuyRequest = {
        selections: await instance.getUtxos(),
        inputs: [
          {
            address,
            datum,
            redeemer: { fields: [], constructor: 0 },
            script,
            utxo: {
              hash: utxo.tx_hash,
              index: utxo.tx_index,
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
      return callKuberAndSubmit(instance, request);
    }
    throw new Error("Missing value");
  } else {
    throw new Error("Undefined instance or UTXO value")
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
        {{
        renderLovelace("fields" in utxo.datum && "int" in utxo.datum.fields[1] ? utxo.datum.fields[1].int : 0)
        }} Ada (Buy)
      </button>
    </div> <!-- /inset -->
  </div>
</template>
<script setup lang="ts">
import { VAceEditor } from "vue3-ace-editor";
import ace from "ace-builds";
import workerJsonUrl from "ace-builds/src-noconflict/mode-json";
import type { BfUTXO, DbUTXO, ListingState } from "@/types";
import { listMarketUtxos } from "@/scripts/blockfrost";
import { renderLovelace } from "@/scripts/wallet";
import { buyHandler } from "@/scripts/transaction";
import { walletAction } from "@/scripts/sotre"
import { convertUtxos } from "@/scripts/database";
ace.config.setModuleUrl("ace/mode/json_worker", workerJsonUrl);
</script>

<template>
  <div class="nfts ml-2">
    <div v-if="utxos.length==0" class="nfts__empty text-gray-400 font-semibold text-center my-5"> {{message}}</div>
    <div v-for="utxo in utxos" :key="utxo.tx_hash" class="nft p-2 flex">
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
        <button @click="buy(utxo)"
          class="bg-transparent hover:bg-blue-300 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-blue-200 rounded">
          {{
          renderLovelace(utxo.datum?.fields[1]?.int)
          }} Ada (Buy)
        </button>
      </div> <!-- /inset -->
    </div> <!-- /nft -->
  </div> <!-- /nfts -->
</template>

<script lang="ts">

export default {
  async created() {
    try {
      const marketUtxos: BfUTXO[] = await listMarketUtxos()
      // Retrieve utxos from db or fetch data from Blockfrost and save to db
      this.utxos = await convertUtxos(marketUtxos)
      if (this.utxos.length == 0) {
        this.message = "Marketplace is empty"
      }
    } catch (e) {
      if (e.status_code == 404) {
        this.message = "Marketplace is empty"
      } else {
        alert(e.message)
      }
    }
  },
  computed: {},
  data(): ListingState {
    return {
      message: "Loading ...",
      hasIndexDb: false,
      utxos: [],
      providers: [],
      addSelections: true,
      interval: 0,
      timeout: 0,
    };
  },
  methods: {
    buy(utxo: DbUTXO): void {
      walletAction.callback = buyHandler(utxo)
      walletAction.enable = true
    },
    save(v: string): void {
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

<script setup lang="ts">
import { curInstance, showMint } from "@/scripts/state"
import { callKuberAndSubmit } from "@/scripts/wallet";
import { buildMintRequest, getUserAddrHash } from "@/scripts/transaction";
import type { HexString } from "@/types";
</script>

<template>
  <div v-if="showMint" class="align-bottom text-blue-900 border-b-2  border-blue-700 pb-5 mb-5 px-4">
    <FormKit type="group" name="metadata" v-model="metadata">
      <FormKit type="text" label="Token Name" name="name" />
      <FormKit type="text" label="Artist" name="artist" />
      <FormKit type="text" label="Image URL" name="image" />
    </FormKit>
    <button @click="mintToken"
      class="w-full border-2 border-indigo-500 cursor-pointer hover:bg-indigo-500 hover:text-white hover:border-indigo-600 active:ring-indigo-700 active:ring-offset-2 active:ring-2 rounded-xl p-2 text-center text-indigo-500">
      Mint
    </button>
    <button @click="cancelMint"
      class="w-full border-2 border-red-500 cursor-pointer hover:bg-red-500 hover:text-white hover:border-red-600 active:ring-red-700 active:ring-offset-2 active:ring-2 rounded-xl p-2 text-center text-red-500">
      Cancel
    </button>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      metadata: {
        name: "",
        artist: "",
        image: "",
        mediaType: "image/jpeg"
      }
    }
  },
  methods: {
    async mintToken() {
      try {
        console.log(this.metadata)
        const keyHash: HexString = await getUserAddrHash(curInstance.value)
        const selections: string[] = await curInstance.value.getUtxos();
        // const request: any = {
        //   selections,
        //   mint: [
        //     {
        //       script: {
        //         type: "sig",
        //         keyHash
        //       },
        //       amount: {},
        //     },
        //   ],
        // };
        // request.mint[0].amount[this.metadata.name] = 1;

        // if (this.metadata.imageUrl || this.metadata.artist) {
        //   request.metadata = {
        //     721: {}
        //   }
        //   request.metadata[721][policyId] = {};
        //   request.metadata[721][policyId][tokenName_] = this.metadata;
        // }
        const request = await buildMintRequest(selections, keyHash, this.metadata)
        console.log(request)
        return callKuberAndSubmit(curInstance.value, request);
      } catch (e) {
        console.error(e);
        alert(e);
      };
    },
    cancelMint() {
      showMint.value = false
    }
  }
}
</script>

<!-- <form id="mint-form" class="fade ani">
  <input name="tokenName"
    class="w-full mb-2 rounded text-gray-800 py-2 px-3 border-2 border-gray-200 focus:outline-2 focus:outline-indigo-500"
    placeholder="Unique Token Name" maxlength="64" />
  <input name="artist"
    class="w-full mb-2 rounded text-gray-800 py-2 px-3 border-2 border-gray-200 focus:outline-2 focus:outline-indigo-500"
    placeholder="Artist" maxlength="64" />
  <input name="imageUrl"
    class="w-full mb-2 rounded text-gray-800 py-2 px-3 border-2 border-gray-200 focus:outline-2 focus:outline-indigo-500"
    placeholder="Image url" maxlength="64" />
</form>
<div class="flex w-full justify-between gap-4"> -->

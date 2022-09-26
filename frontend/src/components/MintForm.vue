<script setup lang="ts">
import { callKuberAndSubmit } from "@/scripts/wallet";
import { buildMintRequest, getUserAddrHash } from "@/scripts/transaction";
import type { CIP30Instance, HexString, KuberMintRequest, NftMetadata } from "@/types";
import { ref, type Ref } from "vue";
import { reset } from '@formkit/core'

const { instance }: Readonly<{
  instance?: CIP30Instance;
}> = defineProps(['instance'])
const isFormShown: Ref<boolean> = ref(false)

function toggleForm() {
  isFormShown.value = !isFormShown.value
}
async function testMint(metadata: any) {
  console.log(typeof metadata)
  await new Promise((r) => setTimeout(r, 1000))
  console.log(metadata)
}
async function mintToken({ metadata }: { metadata: NftMetadata }) {
  try {
    if (typeof instance !== "undefined") {
      console.log(metadata);
      const keyHash: HexString = await getUserAddrHash(instance)
      const selections: string[] = await instance.getUtxos();
      const request: KuberMintRequest = await buildMintRequest(selections, keyHash, metadata)
      console.log(request);
      await callKuberAndSubmit(instance, request);
      isFormShown.value = false;
      reset("mint");
    } else {
      throw new Error("Undefined instance");
    }
  } catch (e) {
    console.error(e);
    alert(e);
  };
}
</script>

<template>
  <button @click="toggleForm" class="float-right text-blue-500 underline">
    Mint NFT
  </button>
  <div v-if="isFormShown" class="align-bottom text-blue-900 border-b-2  border-blue-700 pb-5 mb-5 px-4">
    <FormKit type="form" id="mint" submit-label="Mint" @submit="mintToken">
      <FormKit type="group" name="metadata">
        <!-- https://formkit.com/essentials/validation  -->
        <FormKit type="text" label="Token Name" name="name" validation="required" />
        <FormKit type="text" label="Artist" name="artist" validation="required" />
        <FormKit type="text" label="Copyright" name="copyright" />
        <FormKit type="textarea" label="Description" name="description" />
        <FormKit type="text" label="Image URL" name="image" validation="required | url" />
      </FormKit>
    </FormKit>
    <!-- <button @click="mintToken"
      class="w-full border-2 border-indigo-500 cursor-pointer hover:bg-indigo-500 hover:text-white hover:border-indigo-600 active:ring-indigo-700 active:ring-offset-2 active:ring-2 rounded-xl p-2 text-center text-indigo-500">
      Mint
    </button> -->
    <!-- <button @click="cancelMint"
      class="w-full border-2 border-red-500 cursor-pointer hover:bg-red-500 hover:text-white hover:border-red-600 active:ring-red-700 active:ring-offset-2 active:ring-2 rounded-xl p-2 text-center text-red-500">
      Cancel
    </button> -->
  </div>
</template>

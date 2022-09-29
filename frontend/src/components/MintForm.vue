<script setup lang="ts">
import { buildMintRequest, callKuberAndSubmit, getUserKeyhashes } from "@/utils/transaction";
import type { CIP30Instance, KuberMintRequest, NftMetadata, UserKeyhashes } from "@/types";
import { ref, type Ref } from "vue";
import { reset } from '@formkit/core'

const { instance, selections }: Readonly<{
  instance?: CIP30Instance;
  selections?: string[];
}> = defineProps(['instance', 'selections'])
const isFormShown: Ref<boolean> = ref(false)

function toggleForm() {
  isFormShown.value = !isFormShown.value
}
async function mintToken({ metadata }: { metadata: NftMetadata }) {
  try {
    if (typeof instance !== "undefined") {
      if (typeof selections !== "undefined") {
        console.log(metadata);
        const { pubKeyhash }: UserKeyhashes = await getUserKeyhashes(instance)
        const request: KuberMintRequest = await buildMintRequest(selections, pubKeyhash, metadata)
        console.log(request);
        await callKuberAndSubmit(instance, request);
        isFormShown.value = false;
        reset("mint");
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
  </div>
</template>

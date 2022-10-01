<script setup lang="ts">
import type { NftMetadata } from "@/types";
import { reset } from '@formkit/core'

const emit = defineEmits<{
  (e: 'mint', metadata: NftMetadata): void
  (e: 'hideForm'): void
}>()

async function mintToken({ metadata }: { metadata: NftMetadata }) {
  emit('hideForm');
  reset("mint");
  emit('mint', metadata)
}
</script>

<template>
  <!-- https://formkit.com/guides/create-a-tailwind-theme -->
  <div class="align-bottom text-green-300 font-semibold text-sm pb-5 mb-5 px-4">
    <FormKit type="form" id="mint" submit-label="Mint" @submit="mintToken">
      <FormKit type="group" name="metadata" class="space-y-6">
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

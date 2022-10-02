<script setup lang="ts">
import type { MultiAssetObj } from '@/types';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

const props: Readonly<{
  asset?: MultiAssetObj;
}> = defineProps(['asset'])
const emit = defineEmits<{
  (e: 'sell', asset: MultiAssetObj, sellAmount: number): void
}>()
const inputShown: Ref<boolean> = ref(false)
const sellInput: Ref<string> = ref("")
const sellAmount: ComputedRef<number> = computed((): number => {
  return Math.round(parseFloat(sellInput.value) * 1e6)
})

async function sell(): Promise<void> {
  if (typeof props.asset !== "undefined") {
    emit("sell", props.asset, sellAmount.value)
  } else {
    throw new Error("Undefined asset value")
  }
}

function toggleInput(): void {
  inputShown.value = !inputShown.value;
}
</script>

<template>
  <div class="wallet-asset">
    <img :alt="asset.tokenName + '_img'" v-if="asset.metadata.image" :src="asset.metadata.image" />
    <div class="flex justify-between items-start">
      <span v-if="asset.metadata.name" class="text-green-400 text-xl font-bold pb-2">
        {{ asset.metadata.name }}
      </span>
      <div v-else class="text-purple-400 font-semibold text-lg">
        {{ asset.policy.substring(0, 8) }}...{{ asset.tokenName }}
      </div>
      <button class="font-display font-semibold text-gray-800 text-sm cursor-pointer bg-teal-500 hover:bg-yellow-200 p-2 rounded-lg"
        @click="toggleInput">
        {{!inputShown ? "Sell" : "Cancel"}}
      </button>
    </div>
    <div class="sell-form" v-show="inputShown">
      <FormKit type="number" label="Sell Amount" name="sell-amount" placeholder="Sale Price (Ada)"
        v-model="sellInput" />
      <div class="flex w-full justify-between gap-4">
        <button
          class="w-full border-2 border-indigo-500 cursor-pointer hover:bg-indigo-500 hover:text-white hover:border-indigo-600 active:ring-indigo-700 active:ring-offset-2 active:ring-2 rounded-xl p-2 text-center text-indigo-500"
          @click="sell()">
          Sell
        </button>
      </div>
    </div> <!-- /.sell-form -->
  </div> <!-- /.wallet-asset -->
</template>
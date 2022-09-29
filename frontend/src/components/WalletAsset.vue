<script setup lang="ts">
import { buildSellRequest, callKuberAndSubmit } from '@/utils/transaction';
import type { CIP30Instance, KuberSellRequest, MultiAssetObj, UserKeyhashes } from '@/types';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

const { asset, instance, selections, userKeyhashes }: Readonly<{
  asset?: MultiAssetObj;
  instance?: CIP30Instance;
  selections?: string[];
  userKeyhashes?: UserKeyhashes;
}> = defineProps(['asset', 'instance', 'selections', 'userKeyhashes']);
const inputShown: Ref<boolean> = ref(false)
const sellInput: Ref<string> = ref("")
const sellAmount: ComputedRef<number> = computed((): number => {
  return Math.round(parseFloat(sellInput.value) * 1e6)
})

async function sellNft(): Promise<void> {
  try {
    if (typeof instance !== "undefined" && typeof asset !== "undefined" && typeof userKeyhashes !== "undefined" && typeof selections !== "undefined") {
      const request: KuberSellRequest = await buildSellRequest(asset, selections, sellAmount.value, userKeyhashes)
      callKuberAndSubmit(instance, request);
    } else {
      throw new Error("Undefined prop value")
    }

  }
  catch (e) {
    console.log(e)
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
      <span v-if="asset.metadata.name" class="text-blue-900 text-xl font-extrabold pb-2">
        {{ asset.metadata.name }}
      </span>
      <div v-else class="text-blue-700 font-extrabold">
        {{ asset.policy.substring(0, 8) }}...{{ asset.tokenName }}
      </div>
      <div class="text-blue-600 text-lg cursor-pointer" @click="toggleInput">
        {{!inputShown ? "Sell" : "Cancel"}}
      </div>
    </div>
    <div class="sell-form" v-show="inputShown">
      <FormKit type="number" label="Sell Amount" name="sell-amount" placeholder="Sale Price (Ada)"
        v-model="sellInput" />
      <div class="flex w-full justify-between gap-4">
        <button
          class="w-full border-2 border-indigo-500 cursor-pointer hover:bg-indigo-500 hover:text-white hover:border-indigo-600 active:ring-indigo-700 active:ring-offset-2 active:ring-2 rounded-xl p-2 text-center text-indigo-500"
          @click="sellNft()">
          Sell
        </button>
      </div>
    </div> <!-- /.sell-form -->
  </div> <!-- /.wallet-asset -->
</template>
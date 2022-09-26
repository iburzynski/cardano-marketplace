<script setup lang="ts">
import { market } from '@/config';
import { getUsedAddr, makePubKeyHash, makeStakeKeyHash } from '@/scripts/transaction';
import { callKuberAndSubmit } from '@/scripts/wallet';
import type { CIP30Instance, KuberSellRequest, MultiAssetObj } from '@/types';
import { computed, ref, type ComputedRef, type Ref } from 'vue';
const { instance, asset }: Readonly<{
  instance?: CIP30Instance;
  asset?: MultiAssetObj;
}> = defineProps(['instance', 'asset'])
const isInputShown: Ref<boolean> = ref(false)
const sellInput: Ref<string> = ref("")
const sellAmount: ComputedRef<number> = computed((): number => {
  return Math.round(parseFloat(sellInput.value) * 1e6)
})

async function sellNft(): Promise<void> {
  try {
    if (typeof instance !== "undefined" && typeof asset !== "undefined") {
      const sellerAddr = await getUsedAddr(instance);
      const sellerPkh = makePubKeyHash(sellerAddr);
      const sellerStakeKey = makeStakeKeyHash(sellerAddr);
      const request: KuberSellRequest = {
        selections: await instance.getUtxos(),
        outputs: [
          {
            address: market.address,
            value: `2A + 1 ${asset.policy}.${asset.tokenName}`,
            datum: {
              fields: [
                {
                  fields: [
                    { fields: [{ bytes: `${sellerPkh}` }], constructor: 0 },
                    { fields: [{ bytes: `${sellerStakeKey}` }], constructor: 1 },
                  ],
                  constructor: 0,
                },
                { int: sellAmount.value },
              ],
              constructor: 0
            }
          }
        ]
      };
      callKuberAndSubmit(instance, request);
    } else {
      throw new Error("Undefined instance or asset value")
    }

  }
  catch (e) {
  }
}

function togglePriceInput() {
  isInputShown.value = !isInputShown.value;
}
</script>

<template>
  <div>
    <img :alt="asset.tokenName + '_img'" v-if="asset.metadata.image" :src="asset.metadata.image" />
    <div class="flex justify-between items-start">
      <span v-if="asset.metadata.name" class="text-blue-900 text-xl font-extrabold pb-2">
        {{ asset.metadata.name }}
      </span>
      <div v-else class="text-blue-700 font-extrabold">
        {{ asset.policy.substring(0, 8) }}...{{ asset.tokenName }}
      </div>
      <div class="text-blue-600 text-lg cursor-pointer" @click="togglePriceInput()">
        {{!isInputShown ? "Sell" : "Cancel"}}
      </div>
    </div>

    <div v-show="isInputShown">
      <FormKit type="number" label="Sell Amount" name="sell-amount" placeholder="Sale Price (Ada)"
        v-model="sellInput" />
      <div class="flex w-full justify-between gap-4">
        <div
          class="w-full border-2 border-indigo-500 cursor-pointer hover:bg-indigo-500 hover:text-white hover:border-indigo-600 active:ring-indigo-700 active:ring-offset-2 active:ring-2 rounded-xl p-2 text-center text-indigo-500"
          @click="sellNft()">
          Sell
        </div>
      </div>
    </div>
  </div>
</template>
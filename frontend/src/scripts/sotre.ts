import type { WalletAction } from "@/types";
import { reactive, ref } from "vue";

export const walletState = ref(false);
export const walletAction: WalletAction = reactive({
  enable: false,
  callback: null,
  message: null,
});

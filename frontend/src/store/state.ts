import type { CIP30Instance, CIP30Provider } from "@/types";

export type State = {
  instance: null | CIP30Instance;
  provider: null | CIP30Provider;
  showWallet: boolean;
}

export const state: State = {
  instance: null,
  provider: null,
  showWallet: false
}
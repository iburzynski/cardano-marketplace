import type { CIP30Instance } from "@/types";

export type State = {
  instance: null | CIP30Instance;
  showWallet: boolean;
  utxos: string[];
};

export const state: State = {
  instance: null,
  showWallet: false,
  utxos: [],
};

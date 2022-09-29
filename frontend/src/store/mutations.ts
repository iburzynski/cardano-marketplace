import type { MutationTree } from 'vuex'
import type { CIP30Instance, CIP30Provider } from "@/types"
import type { State } from "./state"

export enum MutationType {
  SetInstance = 'SET_INSTANCE',
  SetUtxos = 'SET_UTXOS',
  ToggleWallet = 'TOGGLE_WALLET'
}

export type Mutations = {
  [MutationType.SetInstance](state: State, instance: null | CIP30Instance): void,
  [MutationType.SetUtxos](state: State, utxos: string[]): void,
  [MutationType.ToggleWallet](state: State): void
}

export const mutations: MutationTree<State> & Mutations = {
  [MutationType.SetInstance](state, instance) {
    state.instance = instance;
  },
  [MutationType.SetUtxos](state, utxos) {
    state.utxos = utxos;
  },
  [MutationType.ToggleWallet](state) {
    state.showWallet = !state.showWallet
  }
}
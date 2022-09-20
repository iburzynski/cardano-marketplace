import type { MutationTree } from 'vuex'
import type { CIP30Instance, CIP30Provider } from "@/types"
import type { State } from "./state"

export enum MutationType {
  SetInstance = 'SET_INSTANCE',
  SetProvider = 'SET_PROVIDER',
  ToggleWallet = 'TOGGLE_WALLET'
}

export type Mutations = {
  [MutationType.SetInstance](state: State, instance: null | CIP30Instance): void,
  [MutationType.SetProvider](state: State, provider: null | CIP30Provider): void,
  [MutationType.ToggleWallet](state: State): void
}

export const mutations: MutationTree<State> & Mutations = {
  [MutationType.SetProvider](state, provider) {
    state.provider = provider;
  },
  [MutationType.SetInstance](state, instance) {
    state.instance = instance;
  },
  [MutationType.ToggleWallet](state) {
    state.showWallet = !state.showWallet
  }
}
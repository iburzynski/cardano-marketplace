import type { CIP30Instance } from '@/types'
import type { GetterTree } from 'vuex'
import type { State } from './state'

export type Getters = {
  getInstance(state: State): null | CIP30Instance
  getShow(state: State): boolean
  getUtxos(state: State): string[]
}

export const getters: GetterTree<State, State> & Getters = {
  getInstance(state) {
    return state.instance;
  },
  getShow(state) {
    return state.showWallet;
  },
  getUtxos(state) {
    return state.utxos;
  }
}
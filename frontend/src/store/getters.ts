import type { CIP30Instance, CIP30Provider } from '@/types'
import type { GetterTree } from 'vuex'
import type { State } from './state'

export type Getters = {
  getInstance(state: State): null | CIP30Instance
  getProvider(state: State): null | CIP30Provider
  getShow(state: State): boolean
}

export const getters: GetterTree<State, State> & Getters = {
  getInstance(state) {
    return state.instance;
  },
  getProvider(state) {
    return state.provider;
  },
  getShow(state) {
    return state.showWallet;
  }
}
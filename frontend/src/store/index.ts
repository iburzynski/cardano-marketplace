import type { CIP30Instance, CIP30Provider } from "@/types";
import { createStore, Store as VuexStore, type CommitOptions, type DispatchOptions } from "vuex";
import { state, type State} from "./state";
import { getters, type Getters } from "./getters";
import { actions, type Actions } from "./actions";
import { mutations, type Mutations } from "./mutations";

export type Store = Omit<
  VuexStore<State>,
  'getters' | 'commit' | 'dispatch'
> & {
  commit<K extends keyof Mutations, P extends Parameters<Mutations[K]>[1]>(
    key: K,
    payload: P,
    options?: CommitOptions
): ReturnType<Mutations[K]>
} & {
  dispatch<K extends keyof Actions>(
    key: K,
    payload?: Parameters<Actions[K]>[1],
    options?: DispatchOptions
  ): ReturnType<Actions[K]>
} & {
  getters: {
    [K in keyof Getters]: ReturnType<Getters[K]>
  }
}
export const store = createStore<State>({
  actions,
  getters,
  mutations,
  state,
});

export function useStore() {
  return store as Store
}
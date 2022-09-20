import type { CIP30Provider } from "@/types";
import type { ActionContext, ActionTree } from "vuex";
import { type Mutations, MutationType } from "./mutations";
import type { State } from "./state";

export enum ActionTypes {
  ConnectProvider = "CONNECT_PROVIDER",
  DisconnectProvider = "DISCONNECT_PROVIDER",
}

type ActionAugments = Omit<ActionContext<State, State>, "commit"> & {
  commit<K extends keyof Mutations>(
    key: K,
    payload: Parameters<Mutations[K]>[1]
  ): ReturnType<Mutations[K]>;
};

export type Actions = {
  [ActionTypes.ConnectProvider](
    context: ActionAugments,
    provider: CIP30Provider
  ): void;
  [ActionTypes.DisconnectProvider](context: ActionAugments): void;
};

export const actions: ActionTree<State, State> & Actions = {
  async [ActionTypes.ConnectProvider]({ commit }, provider) {
    commit(MutationType.SetProvider, provider);
    const instance = await provider.enable();
    commit(MutationType.SetInstance, instance);
  },
  async [ActionTypes.DisconnectProvider]({ commit }) {
    commit(MutationType.SetProvider, null);
    commit(MutationType.SetInstance, null);
  }
};

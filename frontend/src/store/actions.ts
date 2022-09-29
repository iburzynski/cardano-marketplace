import type { CIP30Instance, CIP30Provider } from "@/types";
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
    const instance: CIP30Instance = await provider.enable();
    const utxos: string[] = await instance.getUtxos();
    commit(MutationType.SetInstance, instance);
    commit(MutationType.SetUtxos, utxos);
  },
  async [ActionTypes.DisconnectProvider]({ commit }) {
    commit(MutationType.SetInstance, null);
    commit(MutationType.SetUtxos, []);
  },
};

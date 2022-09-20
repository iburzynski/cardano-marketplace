import { Store } from '@/store';
import { State } from '@/types';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<State>;
  }
}
<script setup lang="ts">
import { market } from "@/config"
import { Bars3Icon, XMarkIcon, GlobeAltIcon, WalletIcon } from "@heroicons/vue/24/outline"
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'


const navigation = [
  { icon: "", name: 'View in Explorer', href: 'https://testnet.cardanoscan.io/address/' + market.address },
  { icon: "", name: 'View on Github', href: 'https://github.com/iburzynski/cardano-marketplace' },
]
const emit = defineEmits<{
  (e: 'openWallet'): void
}>()

function openWallet(): void {
  emit('openWallet')
}
</script>

<template>
  <Disclosure as="nav" class="bg-gray-800 bg-opacity-75" v-slot="{ open }">
    <div class="mx-auto max-w-8xl px-2 sm:px-6 lg:px-8">
      <div class="relative flex h-16 lg:h-24 xl:text-2xl md:space-x-2 lg:space-x-6 xl:space-x-8 items-center">
        <div class="absolute inset-y-0 left-0 flex items-center md:hidden">
          <!-- Mobile menu button-->
          <DisclosureButton
            class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
            <span class="sr-only">Open menu</span>
            <Bars3Icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
            <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
          </DisclosureButton>
        </div>
        <div class="flex flex-1 items-center justify-center md:justify-start">
          <div class="flex items-center">
            <img class="h-8 md:h-12 lg:h-18 xl:h-20 w-auto lg:block" src="../assets/ea_logo.png" alt="EMURGO Academy" />
          </div>
          <h1 class="text-red-400 font-semibold text-sm lg:text-xl xl:text-2xl p-2 md:flex-1 font-display">CNFT Marketplace</h1>
          <div class="hidden md:flex lg:space-x-4">
              <a :href="'https://testnet.cardanoscan.io/address/' + market.address" target="_blank"
                class="text-gray-300 hover:bg-yellow-200 hover:text-gray-700 p-2 rounded-md flex items-center">
                <globe-alt-icon class="h-6 mr-2 inline" />
                View in Explorer
              </a>
              <a href="https://github.com/iburzynski/cardano-marketplace" target="_blank"
                class="text-gray-300 hover:bg-yellow-200 hover:text-gray-700 p-2 rounded-md flex items-center">
                <font-awesome-icon icon="fa-brands fa-github" class="h-6 mr-2" />View on Github
              </a>
          </div>
        </div>
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 md:static md:inset-auto md:pr-0">
          <button @click="openWallet"
            class="text-gray-300 bg-sky-900 hover:bg-teal-400 cursor-pointer hover:text-gray-700 block p-2 rounded-md font-medium">
            <WalletIcon class="h-6 mr-1 inline" />Wallet
          </button>
        </div>
      </div>
    </div>

    <DisclosurePanel class="md:hidden">
      <div class="space-y-1 px-2 pt-2 pb-3">
        <DisclosureButton as="a" :href="'https://testnet.cardanoscan.io/address/' + market.address" target="_blank"
          class="text-gray-300 hover:bg-gray-700 hover:text-white p-2 rounded-md text-xs lg:text-sm font-medium flex items-center">
          <globe-alt-icon class="h-6 mr-2 inline" />
          View in Explorer
        </DisclosureButton>
        <DisclosureButton as="a" href="https://github.com/iburzynski/cardano-marketplace" target="_blank"
          class="text-gray-300 hover:bg-gray-700 hover:text-white p-2 rounded-md text-xs lg:text-sm font-medium flex items-center">
          <font-awesome-icon icon="fa-brands fa-github" class="h-6 mr-2" inverse />View on Github
      </DisclosureButton>
        <!-- <DisclosureButton v-for="item in navigation" :key="item.name" as="a" :href="item.href" target="_blank"
          :class="['text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium']">
          {{ item.name }}</DisclosureButton> -->
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>
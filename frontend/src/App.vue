<script setup lang="ts">
import { RouterView } from "vue-router";
import Wallet from "./components/Wallet.vue"
import { market } from "@/config"
import { useStore } from "vuex";
import { MutationType } from "@/store/mutations";
const store = useStore()
function toggleWallet() {
  store.commit(MutationType.ToggleWallet)
}
</script>

<template>
  <div class="">
    <nav class="
          pl-5
          w-full
          flex flex-wrap
          items-center
          justify-between
          py-2
          bg-gray-100cod
          text-gray-500
          hover:text-gray-700
          focus:text-gray-700
          shadow-lg
          navbar navbar-expand-lg navbar-light
          sticky
          ">
      <div class="collapse navbar-collapse flex-grow items-center" id="navbarSupportedContent">
        <!-- Left links -->
        <ul class=" navbar-nav flex flex-column pl-0 list-style-none mr-auto">

          <li class="nav-item px-2">
            <!-- <a class="nav-link active" aria-current="page" href="/">Marketplace</a> -->
            Marketplace
          </li>
          <li class="nav-item  border-l-2 border-l-gray-300 pl-2">
            <a class="nav-link text-gray-500 hover:text-gray-700 focus:text-gray-700 p-0"
              @click="toggleWallet">Wallet</a>
          </li>
        </ul>
        <!-- Left links -->
      </div>
      <!-- Collapsible wrapper -->
      <div>
        <a :href="'https://testnet.cardanoscan.io/address/'+market.address"
          class="items-center text-sm mr-2 underline text-blue-500">
          View in explorer
        </a>
      </div>
    </nav>
    <Suspense>
      <RouterView class="flex-grow" />
    </Suspense>
    <footer class="bg-gray-200 text-center lg:text-left">
      <div class="text-gray-700 text-center p-4" style="background-color: rgba(0, 0, 0, 0.2);">
        Simple Marketplace |
        <a class="text-gray-800 underline" href="https://github.com/dquadrant/kuber">Powered by Kuber</a>
      </div>
    </footer>
    <Suspense>
      <Wallet />
    </Suspense>
  </div>
</template>

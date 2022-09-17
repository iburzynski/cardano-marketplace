import { createApp } from "vue";
import router from "./router";
import App from "./App.vue";
import "./assets/base.css";
import "@dafcoe/vue-notification/dist/vue-notification.css";
// @ts-ignore
import VueNotificationList from "@dafcoe/vue-notification";
import { plugin, defaultConfig } from "@formkit/vue"

const app = createApp(App);
app.use(VueNotificationList);
app.use(router);
app.use(plugin, defaultConfig)
app.mount("#app");

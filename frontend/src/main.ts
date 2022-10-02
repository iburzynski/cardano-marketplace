import { createApp } from "vue";
// import router from "./router";
import App from "./App2.vue";
import "./assets/base.css";
import "@dafcoe/vue-notification/dist/vue-notification.css";
// @ts-ignore
import VueNotificationList from "@dafcoe/vue-notification";
import { plugin, defaultConfig } from "@formkit/vue"
import { store } from "./store";

import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { faLinkSlash } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faGithub, faLinkSlash)

const app = createApp(App);
app.use(VueNotificationList);
// app.use(router);
app.use(store);
app.use(plugin, defaultConfig);
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount("#app");

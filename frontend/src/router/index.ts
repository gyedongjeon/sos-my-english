import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PracticeView from '../views/PracticeView.vue'
import SettingsView from '../views/SettingsView.vue'

const idProp = (route: { params: Record<string, string | string[]> }) => ({ id: Number(route.params.id) })

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/topics/:id(\\d+)', name: 'practice', component: PracticeView, props: idProp },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

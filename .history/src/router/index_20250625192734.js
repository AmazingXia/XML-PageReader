import Vue from 'vue'
import VueRouter from 'vue-router'
import Reader from '../views/Reader.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Reader',
    component: Reader
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
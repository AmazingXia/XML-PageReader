import Vue from 'vue'
import VueRouter from 'vue-router'
import XmlReader from '../views/Reader.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'XmlReader',
    component: XmlReader
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
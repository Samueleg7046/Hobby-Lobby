import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GroupDetailsView from '../views/GroupDetailsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/groups/:id',
      name: 'groupDetails',
      component: GroupDetailsView,
      props: true
    },
    
  ]
})

export default router
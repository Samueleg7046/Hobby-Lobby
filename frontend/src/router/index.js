import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GroupDetailsView from '../views/GroupDetailsView.vue'
import CreateGroupView from '@/views/CreateGroupView.vue'

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
    {
      path: '/createGroup',
      name: 'createGroup',
      component: CreateGroupView 
    }
  ]
})

export default router
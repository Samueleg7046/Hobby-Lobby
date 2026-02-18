import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GroupDetailsView from '../views/GroupDetailsView.vue'
import CreateGroupView from '@/views/CreateGroupView.vue'
import PlaceDetailsView from '../views/PlaceDetailsView.vue'
import CreatePlaceView from '@/views/CreatePlaceView.vue'

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
    },
    {
      path: '/createPlace',
      name: 'createPlace',
      component: CreatePlaceView 
    },
    {
      path: '/place/:id',
      name: 'placeDetails',
      component: PlaceDetailsView,
      props: true
    },
  ]
})

export default router
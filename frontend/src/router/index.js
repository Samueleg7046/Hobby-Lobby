import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GroupDetailsView from '../views/GroupDetailsView.vue'
import CreateGroupView from '@/views/CreateGroupView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AuthCallback from '../views/AuthCallback.vue'
import ProfileView from '../views/ProfileView.vue'
import PlaceDetailsView from '../views/PlaceDetailsView.vue'
import CreatePlaceView from '@/views/CreatePlaceView.vue'
import CreateReview from '@/views/CreateReview.vue'
import PlaceView from '../views/PlaceView.vue'

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
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/auth/callback',
      name: 'authCallback',
      component: AuthCallback
    },
    {
      path: '/user/:id',
      name: 'profile',
      component: ProfileView
    },
    {path: '/createPlace',
      name: 'createPlace',
      component: CreatePlaceView 
    },
    {
      path: '/place/:id',
      name: 'placeDetails',
      component: PlaceDetailsView,
      props: true
    },
    {
      path: '/place/:id/review',
      name: 'reviewCreate',
      component: CreateReview,
      props: true
    },
    {
      path: '/place/',
      name: 'placeHome',
      component: PlaceView,
      props: true
    },
  ]
})

export default router
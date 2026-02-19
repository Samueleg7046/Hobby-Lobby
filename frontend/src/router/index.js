import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GroupDetailsView from '../views/GroupDetailsView.vue'
import CreateGroupView from '@/views/CreateGroupView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AuthCallback from '../views/AuthCallback.vue'
import ProfileView from '../views/ProfileView.vue'

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
    }
  ]
})

export default router
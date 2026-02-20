<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { ref, watch, computed, onMounted } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const route = useRoute();
const router = useRouter();

const isLoggedIn = ref(false);
const myUserId = ref(null);
const currentUser = ref(null);


const notifications = ref([]); 

const unreadCount = computed(() => {
  return Array.isArray(notifications.value) ? notifications.value.filter(n => !n.isRead).length : 0;
});

const fetchNotifications = async () => {
  if (!myUserId.value) return;
  try {
    const res = await fetch(`${API_URL}/notifications/${myUserId.value}`);
    if (res.ok) {
        const data = await res.json();
        notifications.value = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error("Errore notifiche (Backend forse spento?):", e);
    notifications.value = []; 
  }
};

const handleNotificationClick = async (notification) => {
  if (!notification) return;

  if (!notification.isRead) {
    try {
      await fetch(`${API_URL}/notifications/${notification._id}/read`, {
        method: 'PUT'
      });
      notification.isRead = true;
    } catch (e) { console.error(e); }
  }

  if (notification.type === 'group_join') {
     router.push(`/groups/${notification.relatedId}`);
  }
  else if (notification.type === 'friend_request') {
     router.push(`/user/${myUserId.value}`);
  }
  else if (notification.type === 'message') {
     router.push(`/chat`);
  }
};

const deleteNotification = async (id, event) => {
  if (event) event.stopPropagation();
  notifications.value = notifications.value.filter(n => n._id !== id);
  try {
    await fetch(`${API_URL}/notifications/${id}`, { method: 'DELETE' });
  } catch (e) { console.error(e); }
};

const fetchCurrentUser = async () => {
  if (!myUserId.value) return;
  try {
    const res = await fetch(`${API_URL}/api/v1/users/${myUserId.value}`);
    if (res.ok) {
      currentUser.value = await res.json();
    }
  } catch (e) {
    console.error("Errore caricamento profilo header:", e);
  }
};

const checkAuth = () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  if (token && userId) {
    isLoggedIn.value = true;
    myUserId.value = userId;
    fetchNotifications();
    fetchCurrentUser();
  } else {
    isLoggedIn.value = false;
    myUserId.value = null;
    notifications.value = [];
    currentUser.value = null;
  }
};

const logout = () => {
  localStorage.clear();
  isLoggedIn.value = false;
  notifications.value = [];
  currentUser.value = null;
  router.push('/login');
};

watch(route, checkAuth);
onMounted(checkAuth);
</script>

<template>
  <header class="bg-base-100 p-4 mb-1 shadow sticky top-0 z-50">
    <nav class="container mx-auto flex justify-between items-center">
      
      <RouterLink to="/" class="font-bold text-xl hover:text-primary transition-colors text-indigo-600">
        HobbyLobby
      </RouterLink>

      <div class="flex items-center gap-4">
        
        <RouterLink to="/createGroup" class="btn btn-sm btn-ghost gap-2 hidden sm:flex bg-green-400 hover:bg-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Group
        </RouterLink>

        <RouterLink to="/createPlace" class="btn btn-sm bg-green-400 hover:bg-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Place
        </RouterLink>

        <RouterLink v-if="!isLoggedIn" to="/login" class="btn btn-sm btn-primary text-white">
          Login
        </RouterLink>

        <div v-else class="flex items-center gap-2">
          
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
              <div class="indicator">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <span v-if="unreadCount > 0" class="badge badge-xs badge-error indicator-item"></span>
              </div>
            </div>
            
            <ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-white rounded-box w-80 max-h-96 overflow-y-auto border border-gray-100">
              <li class="menu-title px-2 py-2"><span class="text-xs font-bold uppercase text-gray-500">Notifications</span></li>
              
              <li v-if="notifications.length === 0" class="text-center py-4 text-gray-400 text-sm">No new notifications.</li>
              
              <li v-for="notif in notifications" :key="notif._id" class="border-b last:border-none border-gray-100">
                <a @click="handleNotificationClick(notif)" class="flex flex-col items-start gap-1 py-3 px-2 hover:bg-gray-50 rounded-lg">
                  <div class="flex justify-between w-full">
                    <span class="font-bold text-gray-800" :class="{ 'text-indigo-600': !notif.isRead }">{{ notif.title }}</span>
                    <button @click="(e) => deleteNotification(notif._id, e)" class="btn btn-xs btn-circle btn-ghost text-gray-300 hover:text-red-500">✕</button>
                  </div>
                  <span class="text-xs text-gray-600 leading-tight">{{ notif.message }}</span>
                </a>
              </li>

            </ul>
          </div>

          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
              <div class="w-10 rounded-full border border-gray-300 hover:border-indigo-500 transition-colors">
                <img alt="Avatar" :src="currentUser?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'" />
              </div>
            </div>
            <ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li><RouterLink :to="`/user/${myUserId}`">My Profile</RouterLink></li>
              <li><a @click="logout" class="text-red-500">Logout</a></li>
            </ul>
          </div>
          
        </div>
      </div>
    </nav>
  </header>

  <RouterView :key="$route.fullPath" />
</template>
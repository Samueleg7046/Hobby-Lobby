<script setup>
import GroupCard from '../components/GroupCard.vue';
import PlaceCard from '../components/PlaceCard.vue';
import { ref, onMounted, onActivated } from 'vue';

const groups = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref(''); // Aggiunto per la ricerca

// AUTH
const isLoggedIn = ref(false);
const myUserId = ref(null);
const myUserName = ref('');

const checkAuth = () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  if (token && userId) {
    isLoggedIn.value = true;
    myUserId.value = userId;
    myUserName.value = userName;
  } else {
    isLoggedIn.value = false;
    myUserId.value = null;
  }
};

async function fetchGroups() {
  try {
    loading.value = true;
    error.value = null;
 
    const url = searchQuery.value.trim() 
      ? `http://localhost:8080/api/v1/groups/feed?q=${encodeURIComponent(searchQuery.value.trim())}`
      : 'http://localhost:8080/api/v1/groups/feed';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    groups.value = data;

  } catch (err) {
    console.error("Fetch error: ", err);
    error.value = "Failed to load groups."
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  checkAuth();
  fetchGroups();
});

onActivated(() => {
  checkAuth();
  fetchGroups();
});
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="my-drawer-home" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col min-h-screen bg-base-200 relative">
      <label for="my-drawer-home" aria-label="open sidebar" class="btn btn-square btn-ghost absolute top-2 left-2 z-10 btn-lg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="my-1.5 inline-block size-6"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path><path d="M9 4v16"></path><path d="M14 10l2 2l-2 2"></path></svg>
      </label>
      <div class="min-h-screen bg-base-200 py-8"> 
        <div class="max-w-2xl mx-auto px-4 flex flex-col gap-6">
        
          <h1 class="text-3xl font-bold text-center mb-2">Find a group!</h1>

          <div class="flex gap-2 mb-2">
            <input 
              v-model="searchQuery" 
              @keyup.enter="fetchGroups"
              type="text" 
              placeholder="Search by name, description or tag..." 
              class="input input-bordered w-full shadow-sm focus:outline-none focus:border-indigo-500" 
            />
            <button @click="fetchGroups" class="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none px-8 shadow-sm">
              Search
            </button>
          </div>

          <div v-if="loading" class="flex justify-center py-10">
            <span class="loading loading-spinner loading-lg text-primary"> </span>
          </div>

          <div v-else-if="error" class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span> {{ error }} </span>
            <button class="btn btn-sm px-6" @click="fetchGroups">Retry</button>
          </div>

          <div v-else-if="groups.length === 0" class="text-center py-10">
            <p class="text-gray-500 text-lg">No groups found matching your search.</p>
            <button v-if="searchQuery" @click="searchQuery = ''; fetchGroups()" class="btn btn-ghost mt-4 text-indigo-600">Clear Search</button>
          </div>

          <GroupCard 
            v-else
            v-for="group in groups" 
            :key="group.self"
            :id="group.self.split('/').pop()"
            :title="group.groupName"
            :description="group.description"
            :image="group.imageUrl"
            :tags="group.tags" 
            :members="group.members"
            :myUserId="myUserId"
          />
        </div>
      </div>
    </div>

    <div class="drawer-side is-drawer-close:hidden z-50">
      <label for="my-drawer-home" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu min-h-full w-80 p-4 text-base-content shadow-xl bg-base-100">
          <h2 class="text-xl font-bold mb-4">Menu</h2>
          
          <li><a href="/" class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="my-1.5 inline-block size-4 justify-center"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
              <span class="is-drawer-close:hidden">Home</span>
          </a></li>
          
          <li>
            <router-link to="/chat" class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 my-1.5 inline-block justify-center" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span class="is-drawer-close:hidden">Chats</span>
            </router-link>
          </li>
         
          <li>
            <a href="/place" class="flex items-center gap-2"> 
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="my-1.5 inline-block size-4 justify-center">
                <path d="M14.106 5.553a2 2 0 0 0-1.601 0l-4.63 1.852a2 2 0 0 1-1.475 0L2.512 5.847A1 1 0 0 0 1.2 6.772v11.52c0 .385.22.735.562.906l3.833 1.916a2 2 0 0 0 1.789 0l4.63-1.852a2 2 0 0 1 1.475 0l3.888 1.555a1 1 0 0 0 1.312-.925V6.458a1 1 0 0 0-.562-.906l-3.833-1.916a2 2 0 0 0-1.789 0Z"/>
                <path d="M9 6.892V20.3"/>
                <path d="M15 3.614v13.408"/>
              </svg>
              <span class="is-drawer-close:hidden">Places</span>
            </a>
          </li>
          
        </ul>
    </div>
  </div>
</template>
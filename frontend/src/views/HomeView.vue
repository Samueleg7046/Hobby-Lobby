<script setup>
import GroupCard from '../components/GroupCard.vue';
import { ref, onMounted, onActivated } from 'vue';

const groups = ref([]);
const loading = ref(true);
const error = ref(null);

// AUTH
//const myUserId = "6988e6a7c5caf3ad6a3af73b" // momentaneo
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
    myUserId.value = null; // Nessun utente loggato
  }
};

async function fetchGroups() {
  try {
    loading.value = true;
    error.value = null;

    const response = await fetch('http://localhost:8080/api/v1/groups/feed');

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

  const data = await response.json();

  groups.value = data;

  // DEBUG: Controlla se il backend ci sta mandando i membri!
  console.log("Gruppi caricati:", data);
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

// rafresh data when coming back to this page
onActivated(() => {
  checkAuth();
  fetchGroups();
});
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="my-drawer-home" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col min-h-screen bg-base-200 relative">
      
      <label for="my-drawer-home" aria-label="open sidebar" class="btn btn-square btn-ghost absolute top-2 left-2 z-10 btn-lg lg:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="my-1.5 inline-block size-6"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path><path d="M9 4v16"></path><path d="M14 10l2 2l-2 2"></path></svg>
      </label>

      <div class="min-h-screen bg-base-200 py-8"> 
        <div class="max-w-2xl mx-auto px-4 flex flex-col gap-8">
        
          <h1 class="text-3xl font-bold text-center mb-4 mt-8 lg:mt-0">Find a group!</h1>

          <div v-if="loading" class="flex justify-center py-10">
            <span class="loading loading-spinner loading-lg text-primary"> </span>
          </div>

          <div v-else-if="error" class="alert alert-error">
            <span> {{ error }} </span>
            <button class="btn btn-sm" @click="fetchGroups">Riprova</button>
          </div>

          <div v-else-if="groups.length === 0" class="text-center py-10">
            <p class="text-gray-500 text-lg">Nessun gruppo trovato.</p>
          </div>

          <GroupCard 
            v-else
            v-for="group in groups" 
            :key="group._id || group.self"
            :id="group._id || group.self.split('/').pop()" 
            :title="group.groupName"
            :description="group.description"
            :image="group.imageUrl || group.groupImage" 
            :tags="group.tags" 
            :members="group.participants || group.members" 
            :myUserId="myUserId"
          />
        </div>
      </div>
    </div>

    <div class="drawer-side z-50">
      <label for="my-drawer-home" aria-label="close sidebar" class="drawer-overlay"></label>
      <ul class="menu min-h-full w-80 p-4 text-base-content shadow-xl bg-base-100">
        <h2 class="text-xl font-bold mb-4">Menu</h2>
        <li>
          <router-link to="/">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Homepage
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>
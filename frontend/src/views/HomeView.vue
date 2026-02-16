<script setup>
import GroupCard from '../components/GroupCard.vue';
import { ref, onMounted } from 'vue';

const groups = ref([]);
const loading = ref(true);
const error = ref(null);

async function fetchGroups() {
  try {
    loading.value = true;

    const response = await fetch('http://localhost:8080/api/v1/groups/feed');

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
  fetchGroups();
});
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="my-drawer-home" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col min-h-screen bg-base-200 relative">
      <!-- Sidebar toggle button -->
      <label for="my-drawer-home" aria-label="open sidebar" class="btn btn-square btn-ghost absolute top-2 left-2 z-10 btn-lg">
        <!-- Sidebar toggle icon -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="my-1.5 inline-block size-6"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path><path d="M9 4v16"></path><path d="M14 10l2 2l-2 2"></path></svg>
      </label>
      <!-- Page content here -->
      <div class="min-h-screen bg-base-200 py-8"> 
        <div class="max-w-2xl mx-auto px-4 flex flex-col gap-8">
        
          <h1 class="text-3xl font-bold text-center mb-4">Find a group!</h1>

          <div v-if="loading" class="flex justify-center py-10">
            <span class="loading loading-spinner loading-lg text-primary"> </span>
          </div>

          <div v-else-if="error" class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span> {{ error }} </span>
            <button class="btn btn-sm" @click="fetchGroups">Retry</button>
          </div>

          <div v-else-if="groups.length === 0" class="text-center py-10">
            <p class="text-gray-500 lext-lg">No groups found yet.</p>
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
          />
        </div>
      </div>
    </div>

    <div class="drawer-side is-drawer-close:hidden z-50">
      <label for="my-drawer-home" aria-label="close sidebar" class="drawer-overlay"></label>
        <!-- Sidebar content here -->
        <ul class="menu min-h-full w-80 p-4 text-base-content shadow-xl bg-base-100">
          <!-- List item -->
          <h2 class="text-xl font-bold mb-4">Menu</h2>
          <li>
            <button class="" data-tip="Homepage">

            </button>
          </li>

          <!-- List item -->
          <li><a>
              <!-- Home icon -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor" class="my-1.5 inline-block size-4 justify-center"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
              <span class="is-drawer-close:hidden">Homepage</span>
          </a></li>
          <li><a>Sidebar Item 2</a></li>
        </ul>
    </div>
  </div>
</template>
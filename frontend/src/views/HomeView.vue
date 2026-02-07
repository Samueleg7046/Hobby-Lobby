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
        :title="group.groupName"
        :description="group.description"
        :image="group.imageUrl"
        :tags="group.tags" 
      />
    </div>
  </div>
</template>
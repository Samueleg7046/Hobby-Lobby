<script setup>
import { computed } from 'vue';

const props = defineProps({
  friend: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const displayName = computed(() => props.friend?.displayName || 'Unknown User');
const uniqueName = computed(() => props.friend?.uniqueName || 'user');
const avatarUrl = computed(() => props.friend?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png');
const friendId = computed(() => props.friend?._id);
</script>

<template>
  <div v-if="friendId" class="flex items-center gap-4 bg-white p-4 rounded-lg shadow border border-gray-200 hover:border-indigo-300 transition group">
    <img 
      :src="avatarUrl" 
      class="w-14 h-14 rounded-full object-cover border border-gray-300 group-hover:scale-105 transition"
    >
    <div class="flex-1 min-w-0">
      <h3 class="font-bold text-gray-900 truncate">{{ displayName }}</h3>
      <p class="text-xs text-gray-500 truncate">@{{ uniqueName }}</p>
    </div>
    <router-link 
      :to="`/user/${friendId}`" 
      class="btn btn-sm btn-ghost text-indigo-600 hover:bg-indigo-50"
    >
      Visit Profile
    </router-link>
  </div>
</template>
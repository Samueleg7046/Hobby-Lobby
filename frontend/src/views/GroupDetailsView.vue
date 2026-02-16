<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// To read groupId from URL
const route = useRoute();

const group = ref(null);
const loading = ref(true);  

const fetchGroupData = async () => {
    try {
        const groupId = route.params.id;
        const response = await fetch(`http://localhost:8080/api/v1/groups/${groupId}`);

        if (!response.ok) throw new Error("Group not found");

        group.value = await response.json();
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchGroupData();
});
</script>

<template>
    <div v-if="group" class="min-h-screen bg-base-200 pb-10">   
        <div class="relative w-full h-96">
            <img
                :src="group.imageUrl"
                alt="Group photo"
                class="w-full h-full object-cover"
             />
            <!-- makes the image gradient -->
            <div class="absolute inset-0 bg-gradient-to-t from-base-200 to-transparent"></div>

            <div class="absolute bottom-0 left-0 p-8 w-full">
                <div class="max-w-6xl mx-auto flex justify-between items-end gap-4">
                    <div class="w-full">
                        <h1 class="text-5xl font-extrabold text-primary drop-shadow-md mb-4">{{ group.groupName }} </h1>

                        <div class="flex gap-2 mb-2">
                            <span v-for="tag in group.tags" :key="tag" class="badge badge-soft badge-primary">#{{ tag }}</span>
                        </div>
                    </div>
                    <div class="flex gap-3 shrink-0 mb-1">
                        <div class="card-actions justify-end gap-2 pt-4 mt-4">
                            <!-- bottone "<3"-->
                            <button class="btn btn-circle bg-white btn-primary text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-[1.2em]"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                            </button>
                            <!-- bottone "chat"-->
                            <button class="btn btn-circle bg-white btn-primary text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            </button>
                            <!-- bottone "+"-->
                            <button class="btn btn-circle bg-white btn-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-3 gap-8">
            <div class="col-span-2 space-y-6">
                <div class="card bg-base-100 shadow-xl p-6">
                    <h2 class="text-2xl font-bold mb-4">Description</h2>
                    <p class="text-lg leading-relaxed text-gray-700">
                        {{ group.description }}
                    </p>
                </div>
            </div>

            <div class="space-y-6">
                <div class="card bg-base-100 shadow-xl p-6">
                    <h3 class="font-bold text-gray-500 text-sm mb-4">Details</h3>
                    
                    <div class="flex items-center gap-3 mb-3">
                        <span class="font-semibold">👥 Members: </span>
                        <span>
                            {{ group.members ? group.members.length : 0 }}
                        </span>
                    </div>

                    <div class="flex items-start gap-3 mb-3">
                        <span class="font-semibold shrink-0">📅 Frequency:</span>
                        <span>{{ group.frequency }}</span>
                    </div>
                    
                    <div class="flex items-start gap-3 mb-3">
                        <span class="font-semibold shrink-0">⏳ Duration:</span>
                        <span>{{ group.duration }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="min-h-screen flex justify-center items-center">
        <span class="loading loading-spinner loading-lg"></span>
    </div>
</template>
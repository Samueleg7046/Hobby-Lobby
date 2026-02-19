<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
    id: String, 
    name: String,
    address: String,
    openingTime: String,
    closingTime: String,
    tags: Array,
    description: String,
    image: String 
});

const router = useRouter();

const goToPlace = () => {
    router.push('/place/' + props.id);
};

</script>

<template>
    <div @click="goToPlace" class="card bg-base-100 shadow-xl w-full border border-base-200 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden">
        
        <figure class="h-48 w-full bg-gray-200">
            <img v-if="image" :src="image" alt="Place photo" class="w-full h-full object-cover"/>
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
        </figure>

        <div class="card-body p-5">
            <h2 class="card-title text-xl font-bold">{{ name || 'Name not available' }}</h2>
            
            <p v-if="address" class="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {{ address }}
            </p>

            <p class="text-gray-600 text-sm line-clamp-2">{{ description }}</p>

            <div class="flex flex-wrap gap-1 mt-3">
                <span v-for="tag in tags" :key="tag" class="badge badge-sm badge-soft badge-primary"> 
                    #{{ tag }}
                </span>
            </div>
        </div>
    </div>
</template>
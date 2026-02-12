<script setup>
defineProps({
    id: String,
    title: String,
    description: String,
    image: String,
    tags: Array
})
</script>

<template>
    <router-link
    :to="'/groups/' + id"
    class="card bg-base-100 shadow-xl w-full border border-base-200 hover:shadow-2xl transition-all duration-300">
        <figure class="h-64">
            <img
            :src="image"
            alt="Group photo" 
            class="w-full h-full object-cover"/>
        </figure>
        <div class="card-body">
            <h2 class="card-title text-2xl">{{ title }}</h2>

            <p class="text-gray-600">{{ description }}</p>

            <div class="flex flex-wrap gap-2 my-3">
                <span v-for="tag in tags" :key="tag" class="badge badge-soft badge-primary"> 
                    #{{ tag }}
                </span>
            </div>

            <div class="card-actions justify-end gap-2 pt-4 mt-4 border-t border-base-200">
                <!-- bottone "<3"-->
                <button class="btn btn-circle btn-primary text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-[1.2em]"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                </button>
                <!-- bottone "chat"-->
                <button class="btn btn-circle btn-primary text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </button>
                <!-- bottone "+"-->
                <button class="btn btn-circle btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                </button>
            </div>
        </div>
    </router-link>
</template>

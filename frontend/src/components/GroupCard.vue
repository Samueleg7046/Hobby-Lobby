<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
    id: String,
    title: String,
    description: String,
    image: String,
    tags: Array,
    members: { type: Array, default: () => [] }, 
    myUserId: String,   // momentaneo
    createdBy: String
});

const router = useRouter();

// checks if already member
const isJoined = computed(() => {
    if (!props.members) return false;
    
    return props.members.some(m => {
        if (typeof m === 'string') return m === props.myUserId;
        return (m.userId === props.myUserId) || (m._id === props.myUserId);
    });
});

// When click on card
const goToGroup = () => {
    router.push('/groups/' + props.id);
};

</script>

<template>
    <div @click="goToGroup"
    class="card bg-base-100 shadow-xl w-full border border-base-200 hover:shadow-2xl transition-all duration-300">
        <!-- group image -->
        <figure class="h-64">
            <img
            :src="image"
            alt="Group photo" 
            class="w-full h-full object-cover"/>
        </figure>

        <!-- group title and description -->
        <div class="card-body">
            <div class="flex justify-between items-start gap-2">
                <h2 class="card-title text-2xl">
                    {{ title }}
                </h2>
                <div v-if="isJoined" class="badge badge-success text-white font-bold gap-1 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                    SUBSCIBED
                </div>
            </div>


            <p class="text-gray-600">{{ description }}</p>

            <div class="flex flex-wrap gap-2 my-3">
                <span v-for="tag in tags" :key="tag" class="badge badge-soft badge-primary"> 
                    #{{ tag }}
                </span>
            </div>
        </div>
    </div>
</template>

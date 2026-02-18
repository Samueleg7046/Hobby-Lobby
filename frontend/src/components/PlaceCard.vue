<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
    name: String,
    address: String,
    openingTime: String,
    closingTime: String,
    tags: Array,
    description: String,
    // problems: Array
    // reviews??
});

const router = useRouter();

const goToPlace = () => {
    router.push('/places/' + props.id);
};

</script>

<template>
    <div @click="goToPlace"
        class="card bg-base-100 shadow-xl w-full border border-base-200 hover:shadow-2xl transition-all duration-300">
            <!--IMMAGINE PLACE ANCORA DA CREARE -->
    </div>

    <p class="text-gray-600">{{ description }}</p>

            <div class="flex flex-wrap gap-2 my-3">
                <span v-for="tag in tags" :key="tag" class="badge badge-soft badge-primary"> 
                    #{{ tag }}
                </span>
            </div>

</template>
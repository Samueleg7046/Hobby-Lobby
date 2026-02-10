<script setup>
import { ref, onMounted } from 'vue';







</script>

<template>
    <div class="min-h-screen bg-base-200 py-8">
        <div class="max-w-screen mx-auto px-4 flex flex-col gap-8">
            <img
                :src="image"
                alt="Group photo"
                class="w-full h-full object-cover absolute"
             />
            <div 
                class="absolute inset-0 z-10 backdrop-blur-xl"
                style="-webkit-mask-image: linear-gradient(to bottom, transparent 50%, black 100%);
                mask-image: linear-gradient(to bottom, transparent 50%, black 100%);"
            >
            </div>

            <h1 class="text-3xl font-bold text-center mb-4 ">{{ title }} </h1>


        </div>
    </div> 
</template>
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const review = ref(null);
const loading = ref(true);  

const myUserId = "6988e6a7c5caf3ad6a3af73b" // momentaneo

const fetchReviewData = async () => {
    try {
        const reviewId = route.params.review_id; // forse cambiare con const {reviewId} = route.params (se non funziona)
        const placeId = route.params.place_id;
        const response = await fetch(`http://localhost:8080/api/v1/places/${placeId}/reviews/${reviewId}`);

        if (!response.ok) throw new Error("Recensione non trovata");

        review.value = await response.json();
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchReviewData();
});
</script>

<template>
    <div v-if="review" class="min-h-screen bg-base-200 pb-10">   

            <div class="absolute bottom-0 left-0 p-8 w-full">
                <div class="max-w-6xl mx-auto flex justify-between items-end gap-4">
                    <div class="w-full">
                        <h1 class="text-5xl font-extrabold text-primary drop-shadow-md mb-4">{{ review.valutazione }} </h1>
                    </div>
            </div>
        </div>
        
        <div class="flex gap-3 shrink-0 mb-1">
            <div class="card-actions justify-end gap-2 pt-4 mt-4">
                    <div class="flex gap-3 shrink-0 mb-1">
                        <div class="card-actions justify-end gap-2 pt-4 mt-4"></div>
                    </div>
                </div>
        </div>

    <!-- DESCRIZIONE -->
    <div class="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-3 gap-8">
            <div class="col-span-2 space-y-6">
                <div class="card bg-base-100 shadow-xl p-6">
                    <h2 class="text-2xl font-bold mb-4">Descrizione</h2>
                    <p class="text-lg leading-relaxed text-gray-700">{{ review.descrizione }}
                    </p>
                </div>
            </div>
        </div>

</div>

</template>
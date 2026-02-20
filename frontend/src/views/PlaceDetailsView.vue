<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const route = useRoute();

const place = ref(null);
const loading = ref(true);
const error = ref(null);

const reviews = ref([]);
const newReview = ref({ valutazione: 5, description: '' });
const reviewLoading = ref(false);

const myUserId = localStorage.getItem('userId');
const userRole = localStorage.getItem('role');
const isAdmin = computed(() => userRole === 'admin');

const fetchPlaceData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const placeId = route.params.id; 
        const response = await fetch(`${API_URL}/places/${placeId}`);

        if (!response.ok) throw new Error("Place not found");

        place.value = await response.json();
    } catch (err) {
        console.error(err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const fetchReviews = async () => {
    try {
        const placeId = route.params.id;
        const res = await fetch(`${API_URL}/places/${placeId}/reviews`);
        if (res.ok) {
            reviews.value = await res.json();
        }
    } catch (e) {
        console.error("Error fetching reviews:", e);
    }
};

const submitReview = async () => {
    if (!newReview.value.valutazione || !myUserId) {
        alert("You must be logged in and provide a rating.");
        return;
    }
    
    reviewLoading.value = true;
    try {
        const placeId = route.params.id;
        const res = await fetch(`${API_URL}/places/${placeId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userID: myUserId,
                valutazione: newReview.value.valutazione,
                description: newReview.value.description
            })
        });

        if (res.ok) {
            newReview.value = { valutazione: 5, description: '' }; 
            await fetchReviews(); 
            await fetchPlaceData(); 
            alert("Review published successfully!");
        } else {
            const data = await res.json();
            alert(data.message || "Error submitting review");
        }
    } catch (e) {
        console.error(e);
        alert("Network error");
    } finally {
        reviewLoading.value = false;
    }
};

const deleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
        const placeId = route.params.id;
        const res = await fetch(`${API_URL}/places/${placeId}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID: myUserId, role: userRole })
        });
        
        if (res.ok) {
            await fetchReviews();
            await fetchPlaceData();
        } else {
            const data = await res.json();
            alert(data.message || "Error deleting review");
        }
    } catch(e) { 
        console.error(e); 
    }
};

onMounted(async () => {
    await fetchPlaceData();
    await fetchReviews();
});
</script>

<template>
    <div v-if="loading" class="min-h-screen flex justify-center items-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="error" class="min-h-screen flex flex-col justify-center items-center text-center p-4">
        <h2 class="text-2xl font-bold text-red-500 mb-2">Error</h2>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <router-link to="/place" class="btn btn-primary px-6 text-white">Return to Places List</router-link>
    </div>

    <div v-else-if="place" class="min-h-screen bg-base-200 pb-10">   
        <div class="relative w-full h-96">
            <img
                :src="place.imageUrl || 'https://images.unsplash.com/photo-1524169358666-79f22534bc6e?q=80&w=1000'"
                alt="Place photo"
                class="w-full h-full object-cover"
             />

            <div class="absolute inset-0 bg-gradient-to-t from-base-200 to-transparent"></div>

            <div class="absolute bottom-0 left-0 p-8 w-full">
                <div class="max-w-6xl mx-auto flex justify-between items-end gap-4">
                    <div class="w-full">
                        <h1 class="text-5xl font-extrabold text-primary drop-shadow-md mb-4">{{ place.placeName }} </h1>

                        <div class="flex gap-2 mb-2">
                            <span v-for="tag in place.tags" :key="tag" class="badge badge-soft badge-primary">#{{ tag }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div class="md:col-span-2 space-y-6">
                <div class="card bg-base-100 shadow-xl p-6">
                    <h2 class="text-2xl font-bold mb-4">Description</h2>
                    <p class="text-lg leading-relaxed text-gray-700">
                        {{ place.descrizione_luogo || 'No description available.' }}
                    </p>
                </div>

                <div class="card bg-base-100 shadow-xl p-6 border border-gray-100">
                    <h3 class="font-bold text-lg mb-4">Leave a Review</h3>
                    <form @submit.prevent="submitReview" class="flex flex-col gap-4">
                        <div class="flex items-center gap-4">
                            <label class="font-semibold text-gray-700">Rating:</label>
                            <div class="rating">
                              <input type="radio" name="rating-2" value="1" v-model="newReview.valutazione" class="mask mask-star-2 bg-orange-400" />
                              <input type="radio" name="rating-2" value="2" v-model="newReview.valutazione" class="mask mask-star-2 bg-orange-400" />
                              <input type="radio" name="rating-2" value="3" v-model="newReview.valutazione" class="mask mask-star-2 bg-orange-400" />
                              <input type="radio" name="rating-2" value="4" v-model="newReview.valutazione" class="mask mask-star-2 bg-orange-400" />
                              <input type="radio" name="rating-2" value="5" v-model="newReview.valutazione" class="mask mask-star-2 bg-orange-400" checked />
                            </div>
                        </div>
                        <textarea v-model="newReview.description" class="textarea textarea-bordered w-full" placeholder="What do you think about this place?"></textarea>
                        <button type="submit" class="btn px-6 bg-indigo-600 hover:bg-indigo-700 text-white border-none w-full md:w-auto self-end" :disabled="reviewLoading">
                            <span v-if="reviewLoading" class="loading loading-spinner loading-sm"></span>
                            Publish Review
                        </button>
                    </form>
                </div>

                <div class="mt-8">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold">Reviews ({{ reviews.length }})</h2>
                    </div>

                    <div v-if="reviews.length > 0" class="space-y-4">
                        <div v-for="review in reviews" :key="review._id" class="card bg-base-100 shadow-sm border border-gray-100 p-5 relative group">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <img :src="review.userID?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'" class="w-10 h-10 rounded-full object-cover">
                                    <div>
                                        <p class="font-bold text-gray-900">{{ review.userID?.displayName || 'Unknown User' }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
                                    <span class="font-bold text-sm">{{ review.valutazione }}/5</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>
                            </div>
                            <p class="text-gray-600 italic mb-4">"{{ review.description }}"</p>

                            <button 
                                v-if="(review.userID?._id === myUserId) || isAdmin" 
                                @click="deleteReview(review._id)" 
                                class="btn btn-sm px-6 bg-red-600 hover:bg-red-700 text-white border-none absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete Review"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                    <div v-else class="text-center py-10 text-gray-400 bg-base-100 rounded-xl border-dashed border-2">
                        No reviews for this place yet. Be the first!
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="card bg-base-100 shadow-xl p-6">
                    <h3 class="font-bold text-gray-500 text-sm mb-4">Place Details</h3>
                    
                    <div class="flex items-start gap-3 mb-3">
                        <span class="font-semibold shrink-0">📍 Address:</span>
                        <span>{{ place.indirizzo || 'N/A' }}</span>
                    </div>

                    <div class="flex items-start gap-3 mb-3">
                        <span class="font-semibold shrink-0">🏃 Activity:</span>
                        <span>{{ place.attivita || 'No activity specified' }}</span>
                    </div>

                    <div class="flex items-start gap-3 mb-3">
                        <span class="font-semibold shrink-0">⭐ Average Rating:</span>
                        <span v-if="place.media_recensioni > 0" class="font-bold text-indigo-600">{{ place.media_recensioni }} out of 5</span>
                        <span v-else>No Rating</span>
                    </div>

                    <div class="flex items-start gap-3 mb-3">
                        <span class="font-semibold shrink-0">🟢 Opening:</span>
                        <span>{{ place.orarioApertura || 'N/A' }}</span>
                    </div>
                    
                    <div class="flex items-start gap-3 mb-3">
                        <span class="font-semibold shrink-0">🔴 Closing:</span>
                        <span>{{ place.orarioChiusura || 'N/A' }}</span>
                    </div>
                </div>

                <div v-if="place.problemi && place.problemi.length > 0" class="card bg-red-50 shadow-md border border-red-200 p-6">
                    <h3 class="font-bold text-red-600 text-sm mb-3">⚠️ Reports and Issues</h3>
                    <ul class="list-disc list-inside text-red-700 text-sm space-y-2">
                        <li v-for="(prob, index) in place.problemi" :key="index">
                            <strong>{{ prob.tipo }}:</strong> {{ prob.descrizione }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>
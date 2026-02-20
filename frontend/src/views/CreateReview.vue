<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const router = useRouter();

const form = ref({
    userId: '', // momentaneo
    descrizione: '',
    valutazione: 0
});

const loading = ref(false);
const error = ref(null);

async function createReview() {
    loading.value = true;
    error.value = null;

    try {

        const payload = {
            userId: form.value.userId, // momentaneo
            descrizione: form.value.descrizione,
            valutazione: form.value.valutazione
        };

        const response = await fetch(`${API_URL}/places/:{place_id}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                //'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Errore  server: ${response.status}`);
        }

        // if successful return to home 
        router.push('/');
    } catch (err) {
        console.err("Errore durante la creazione della recensione", err);
        error.value = err.message || "Impossibile creare recensione";
    } finally {
        loading.value = false;
    }

}
</script>

<template>
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    
        <div class="card w-full max-w-lg bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl justify-center mb-6">Posta una recensione!</h2>

                <div v-if="error" class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{{ error }}</span>
                </div>
        
                <form @submit.prevent="createReview" class="flex flex-col gap-4">
                    <!-- momentaneo -->
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">UserId </span>
                        </label>
                        <input 
                        v-model="form.userId" 
                        type="text" 
                        placeholder="" 
                        class="input input-bordered w-full" 
                        required
                        />
                    </div>
                
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Descrizione</span>
                        </label>
                        <input 
                        v-model="form.descrizione" 
                        type="text" 
                        placeholder="" 
                        class="input input-bordered w-full" 
                        required
                        />
                    </div>

                    <div class="form-control w-full flex flex-col gap-2">
                    <label class="label">
                        <span class="label-text font-semibold">Valutazione</span>
                    </label>   
                    <div class="rating">
                        <input 
                            type="radio" 
                            name="rating" 
                            class="mask mask-star" 
                            aria-label="1 star" 
                            value="1"
                            v-model="form.valutazione"  
                        />
                        <input 
                            type="radio" 
                            name="rating" 
                            class="mask mask-star" 
                            aria-label="2 star" 
                            value="2"
                            v-model="form.valutazione"  
                        />
                        <input 
                            type="radio" 
                            name="rating" 
                            class="mask mask-star" 
                            aria-label="3 star" 
                            value="3"
                            v-model="form.valutazione"  
                        />
                        <input 
                            type="radio" 
                            name="rating" 
                            class="mask mask-star" 
                            aria-label="4 star" 
                            value="4"
                            v-model="form.valutazione"  
                        />
                        <input 
                            type="radio" 
                            name="rating" 
                            class="mask mask-star" 
                            aria-label="5 star" 
                            value="5"
                            v-model="form.valutazione"  
                        />
                    </div>
                    <p v-if="form.valutazione" class="text-sm text-gray-600">
                        Valutazione: {{ form.valutazione }}/5
                    </p>
                    </div>

                    <div class="card-actions justify-end mt-6">
                        <button type="button" class="btn btn-primary bg-rose-400 hover:bg-rose-500 px-2 " @click="router.back()">Cancel</button>
                        
                        <button type="submit" class="btn btn-primary bg-green-400 hover:bg-green-500 px-2" :disabled="loading">
                            <span v-if="loading" class="loading loading-spinner"></span>
                            {{ loading ? 'Saving...' : 'Create Review' }}
                        </button>
                    </div>

                </form>
            </div>
        </div>

    </div>
</template>
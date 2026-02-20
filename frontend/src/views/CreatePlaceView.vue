<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const router = useRouter();

const form = ref({
    placeName: '',
    indirizzo: '',
    attivita: '', 
    orarioApertura: '',
    orarioChiusura: '',
    tags: '',
    descrizione_luogo: '',
    imageUrl: ''
});

const loading = ref(false);
const error = ref(null);

async function createPlace() {
    loading.value = true;
    error.value = null;

    try {
        const tagsArray = form.value.tags ? form.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

        const payload = {
            placeName: form.value.placeName,
            indirizzo: form.value.indirizzo,
            attivita: form.value.attivita || "No activity specified",
            orarioApertura: form.value.orarioApertura,
            orarioChiusura: form.value.orarioChiusura,
            descrizione_luogo: form.value.descrizione_luogo || "", 
            tags: tagsArray,
            imageUrl: form.value.imageUrl || "" 
        };

        const response = await fetch(`${API_URL}/places`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server error: ${response.status}`);
        }

        router.push('/place');
    } catch (err) {
        console.error("Error creating place:", err);
        error.value = err.message || "Unable to create place";
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    
        <div class="card w-full max-w-lg bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl justify-center mb-6">Register a new place</h2>

                <div v-if="error" class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{{ error }}</span>
                </div>
                
                <form @submit.prevent="createPlace" class="flex flex-col gap-4">

                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Place Name *</span>
                        </label>
                        <input 
                        v-model="form.placeName" 
                        type="text" 
                        placeholder="e.g. City Library" 
                        class="input input-bordered w-full" 
                        required
                        />
                    </div>

                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Activity</span>
                        </label>
                        <input 
                        v-model="form.attivita" 
                        type="text" 
                        placeholder="e.g. Reading, Studying..." 
                        class="input input-bordered w-full" 
                        />
                    </div>

                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Address *</span>
                        </label>
                        <input 
                        v-model="form.indirizzo" 
                        type="text" 
                        placeholder="123 Main St, New York" 
                        class="input input-bordered w-full" 
                        required
                        />
                    </div>

                    <div class="form-control w-full flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text font-semibold">Description</span>
                        </label>
                        <textarea 
                        v-model="form.descrizione_luogo" 
                        class="textarea textarea-bordered h-24 w-full" 
                        placeholder="How would you describe this place?"
                        ></textarea>
                    </div>
                    
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Image (URL)</span>
                        </label>
                        <input 
                        v-model="form.imageUrl" 
                        type="url" 
                        placeholder="https://i.imgur.com/..." 
                        class="input input-bordered w-full" 
                        />
                    </div>

                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Tags (comma separated) *</span>
                        </label>
                        <input 
                        v-model="form.tags" 
                        type="text" 
                        placeholder="books, entertainment..." 
                        class="input input-bordered w-full" 
                        required
                        />
                    </div>

                    <div class="flex gap-4">
                        <div class="form-control flex-1">
                            <label class="label">
                                <span class="label-text font-semibold">Opening Time *</span>
                            </label>
                            <input 
                            v-model="form.orarioApertura" 
                            type="time" 
                            class="input input-bordered w-full" 
                            required
                            />
                        </div>

                        <div class="form-control flex-1">
                            <label class="label">
                                <span class="label-text font-semibold">Closing Time *</span>
                            </label>
                            <input 
                            v-model="form.orarioChiusura" 
                            type="time" 
                            class="input input-bordered w-full" 
                            required
                            />
                        </div>
                    </div>

                    <div class="card-actions justify-end mt-6">
                        <button type="button" class="btn btn-ghost px-6" @click="router.back()">Cancel</button>
                        <button type="submit" class="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none px-6" :disabled="loading">
                            <span v-if="loading" class="loading loading-spinner"></span>
                            {{ loading ? 'Saving...' : 'Create Place' }}
                        </button>
                    </div>

                </form>
            </div>
        </div>

    </div>
</template>
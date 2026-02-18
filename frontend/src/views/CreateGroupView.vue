<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const form = ref({
    userId: '',
    groupName: '',
    tags: '',
    duration: '',
    frequency: '',
    imageUrl: '',
    description: ''
});

const loading = ref(false);
const error = ref(null);

async function createGroup() {
    loading.value = true;
    error.value = null;

    try {

        // Transforms tags separated by comma to array of tags
        const tagsArray = form.value.tags ? form.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

        const payload = {
            userId: form.value.userId, // momentaneo
            groupName: form.value.groupName,
            description: form.value.description || null,
            imageUrl: form.value.imageUrl,
            tags: tagsArray,
            duration: form.value.duration,
            frequency: form.value.frequency
        };

        const response = await fetch('http://localhost:8080/api/v1/groups', {
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
        console.error("Error during group creation:", err);
        error.value = err.message || "Impossible to create group";
    } finally {
        loading.value = false;
    }

}
</script>

<template>
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    
        <div class="card w-full max-w-lg bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl justify-center mb-6">Create a new group</h2>

                <div v-if="error" class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{{ error }}</span>
                </div>
        
                <form @submit.prevent="createGroup" class="flex flex-col gap-4">
                    <!-- momentaneo -->
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">UserId *</span>
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
                            <span class="label-text font-semibold">Group name *</span>
                        </label>
                        <input 
                        v-model="form.groupName" 
                        type="text" 
                        placeholder="e.g. Book club" 
                        class="input input-bordered w-full" 
                        required
                        />
                    </div>

                    <div class="form-control w-full flex flex-col gap-2">
                        <label class="label">
                            <span class="label-text font-semibold">Description </span>
                        </label>
                        <textarea 
                        v-model="form.description" 
                        class="textarea textarea-bordered h-24 w-full" 
                        placeholder="What is this group about?"
                        ></textarea>
                    </div>

                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">URL Group image *</span>
                        </label>
                        <input 
                        v-model="form.imageUrl" 
                        type="url" 
                        placeholder="https://i.imgur.com/..." 
                        class="input input-bordered w-full" 
                        required
                        />
                    </div>
                    
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Tags (separated by comma) *</span>
                        </label>
                        <input 
                        v-model="form.tags" 
                        type="text" 
                        placeholder="library, books, fantasy" 
                        class="input input-bordered w-full" 
                        required
                        />
                    </div>

                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Duration *</span>
                        </label>
                        <input 
                        v-model="form.duration" 
                        type="text" 
                        placeholder="e.g. 2 hours" 
                        class="input input-bordered w-full" 
                        required
                        />
                    </div>

                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Frequency *</span>
                        </label>
                        <input 
                        v-model="form.frequency" 
                        type="text" 
                        placeholder="e.g. weekly" 
                        class="input input-bordered w-full" 
                        required
                        />
                    </div>

                    <div class="card-actions justify-end mt-6">
                        <button type="button" class="btn btn-primary bg-rose-400 hover:bg-rose-500 px-2 " @click="router.back()">Cancel</button>
                        
                        <button type="submit" class="btn btn-primary bg-green-400 hover:bg-green-500 px-2" :disabled="loading">
                            <span v-if="loading" class="loading loading-spinner"></span>
                            {{ loading ? 'Saving...' : 'Create Group' }}
                        </button>
                    </div>

                </form>
            </div>
        </div>

    </div>
</template>
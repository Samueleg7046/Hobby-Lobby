<script setup>
import { computed, ref, reactive } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const props = defineProps({
  user: { type: Object, required: true },
  stats: { type: Object, default: () => ({ groups: 0, friends: 0 }) },
  isMyProfile: { type: Boolean, default: false }
});

const emit = defineEmits(['updateUser']);
const isEditing = ref(false);
const loading = ref(false);

const formData = reactive({
    displayName: '',
    description: '',
    profilePicture: '',
    hobbiesString: ''
});

const startEditing = () => {
    formData.displayName = props.user.displayName;
    formData.description = props.user.description || '';
    formData.profilePicture = props.user.profilePicture || '';
    formData.hobbiesString = props.user.hobbies ? props.user.hobbies.join(', ') : '';
    isEditing.value = true;
};

const cancelEditing = () => {
    isEditing.value = false;
};

const saveProfile = async () => {
    loading.value = true;
    try {
        const hobbiesArray = formData.hobbiesString
            .split(',')
            .map(h => h.trim())
            .filter(h => h.length > 0);

        const updates = {
            displayName: formData.displayName,
            description: formData.description,
            profilePicture: formData.profilePicture,
            hobbies: hobbiesArray
        };
        const res = await fetch(`${API_URL}/users/${props.user._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!res.ok) throw new Error("Errore salvataggio");

        const updatedUser = await res.json();
        emit('updateUser', updatedUser);
        isEditing.value = false;

    } catch (error) {
        alert("Errore: " + error.message);
    } finally {
        loading.value = false;
    }
};

const avatarUrl = computed(() => {
    const url = isEditing.value ? formData.profilePicture : props.user?.profilePicture;
    return url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
});

const userHobbies = computed(() => props.user?.hobbies || []);
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm relative transition-all duration-300">
    <div class="flex flex-col md:flex-row items-start gap-6">
      <div class="flex flex-col items-center gap-3">
          <img 
            class="h-24 w-24 object-cover rounded-full border-4 border-indigo-50 shadow-sm" 
            :src="avatarUrl" 
            alt="Profile"
          >
          <div v-if="isEditing" class="w-full max-w-xs">
              <label class="label pb-1"><span class="label-text text-xs">Profile Picture URL</span></label>
              <input v-model="formData.profilePicture" type="text" placeholder="https://..." class="input input-bordered input-xs w-full" />
          </div>
      </div>
      
      <div class="flex-1 w-full">
        <div v-if="!isEditing">
            <h1 class="text-2xl font-bold text-gray-900">{{ user?.displayName || 'User' }}</h1>
            <p class="text-sm text-gray-500">@{{ user?.uniqueName }}</p>
            <p class="mt-3 text-gray-700 whitespace-pre-line leading-relaxed">
              {{ user?.description || 'No description added.' }}
            </p>
            <div class="flex flex-wrap gap-2 mt-4" v-if="userHobbies.length > 0">
              <span v-for="hobby in userHobbies" :key="hobby" class="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
                #{{ hobby }}
              </span>
            </div>
        </div>

        <div v-else class="flex flex-col gap-3 animate-fade-in w-full">
            <div>
                <label class="label py-1"><span class="label-text font-bold">Display Name</span></label>
                <input v-model="formData.displayName" type="text" class="input input-bordered input-sm w-full font-bold" />
            </div>
            <div>
                <label class="label py-1"><span class="label-text font-bold">Description</span></label>
                <textarea v-model="formData.description" class="textarea textarea-bordered w-full" rows="3"></textarea>
            </div>
            <div>
                <label class="label py-1"><span class="label-text font-bold">Hobby (separated by commas)</span></label>
                <input v-model="formData.hobbiesString" type="text" class="input input-bordered input-sm w-full" />
            </div>
            <div class="flex gap-2 mt-2 justify-end">
              <button 
                @click="cancelEditing" 
                class="btn px-4 btn-sm btn-ghost text-gray-500 hover:bg-gray-100" 
                :disabled="loading"
              >
                Cancel
              </button>
    
              <button 
                  @click="saveProfile" 
                  class="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-none px-4 shadow-sm" 
                  :disabled="loading"
              >
                <span v-if="loading" class="loading loading-spinner loading-xs"></span>
                Save
              </button>
            </div>
        </div>

      </div>

      <div v-if="!isEditing" class="flex items-center gap-4 text-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 shrink-0 w-full md:w-auto justify-center md:justify-start">
        
        <button 
            v-if="isMyProfile" 
            @click="startEditing"
            class="btn btn-circle btn-sm btn-ghost"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
        </button>

        <div>
          <span class="block font-bold text-xl text-indigo-600">{{ stats.groups }}</span>
          <span class="text-xs text-gray-500 uppercase tracking-wide">Groups</span>
        </div>
        <div>
          <span class="block font-bold text-xl text-indigo-600">{{ stats.friends }}</span>
          <span class="text-xs text-gray-500 uppercase tracking-wide">Friends</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
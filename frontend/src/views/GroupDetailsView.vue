<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const group = ref(null);
const loading = ref(true);  
const joinLoading = ref(false);
const saveLoading = ref(false);
const error = ref(null);

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const myUserId = localStorage.getItem('userId');
const isSaved = ref(false);

const isJoined = computed(() => {
    if (!group.value || !group.value.members) return false;
    return group.value.members.some(m => {
        if (typeof m === 'string') return m === myUserId;
        return m.userId === myUserId || m._id === myUserId;
    });
});

const triggerToast = (message, type = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 3000);
};

const fetchGroupData = async () => {
    loading.value = true;
    error.value = null;
    try {
        const groupId = route.params.id;
        if (!groupId || groupId === 'undefined') throw new Error("ID Gruppo non valido");

        const response = await fetch(`http://localhost:8080/api/v1/groups/${groupId}`);
        if (!response.ok) throw new Error("Gruppo non trovato");

        group.value = await response.json();
    } catch (err) {
        console.error("Errore fetch:", err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const checkSavedStatus = async () => {
    if (!myUserId || !group.value) return;
    try {
        const response = await fetch(`http://localhost:8080/api/v1/users/${myUserId}`);
        if (!response.ok) return;
        const user = await response.json();
        
        // Cerca l'ID. Nota: usiamo l'ID corrente del gruppo visualizzato
        const currentGroupId = group.value._id || group.value.groupId || route.params.id;

        if (user.savedGroups) {
            isSaved.value = user.savedGroups.some(g => {
                const savedId = typeof g === 'string' ? g : g._id;
                return savedId === currentGroupId;
            });
        }
    } catch (error) { console.error(error); }
};

const handleSave = async () => {
    if (saveLoading.value || !group.value) return;
    saveLoading.value = true;
    const method = isSaved.value ? 'DELETE' : 'PUT';
    
    try {
        const targetId = group.value._id || group.value.groupId || route.params.id;
        
        const response = await fetch(`http://localhost:8080/api/v1/users/${myUserId}/saved/groups/${targetId}`, {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error("Errore aggiornamento preferiti");
        isSaved.value = !isSaved.value;
        triggerToast(isSaved.value ? "Gruppo salvato!" : "Gruppo rimosso dai preferiti", "success");
    } catch (error) {
        triggerToast("Errore nel salvataggio", "error");
    } finally {
        saveLoading.value = false;
    }
};

const handleJoin = async () => {
    if (joinLoading.value || !group.value) return;
    joinLoading.value = true;
    const action = isJoined.value ? 'leave' : 'join';
    const method = isJoined.value ? 'DELETE' : 'POST';

    try {
        const targetId = group.value.groupId || group.value._id || route.params.id;
        const response = await fetch(`http://localhost:8080/api/v1/groups/${targetId}/${action}`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: myUserId })
        });

        if (!response.ok) throw new Error("Errore operazione");

        if (action === 'join') {
            group.value.members.push({ userId: myUserId });
            triggerToast("Ti sei unito al gruppo!", "success");
        } else {
            group.value.members = group.value.members.filter(m => {
                const id = (typeof m === 'string') ? m : (m.userId || m._id);
                return id !== myUserId;
            });
            triggerToast("Hai lasciato il gruppo", "info");
        }
    } catch (error) {
        alert("Errore: " + error.message);
    } finally {
        joinLoading.value = false;
    }
};

onMounted(async () => {
    await fetchGroupData();
    if (group.value && myUserId) checkSavedStatus();
});
</script>

<template>
    <div v-if="loading" class="min-h-screen flex justify-center items-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else-if="error" class="min-h-screen flex flex-col justify-center items-center text-center p-4">
        <h2 class="text-2xl font-bold text-red-500 mb-2">Errore</h2>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <router-link to="/" class="btn btn-primary">Torna alla Home</router-link>
    </div>

    <div v-else-if="group" class="min-h-screen bg-base-200 pb-10">   
        <div class="relative w-full h-96">
            <img :src="group.imageUrl || group.groupImage" alt="Group" class="w-full h-full object-cover"/>
            <div class="absolute inset-0 bg-gradient-to-t from-base-200 to-transparent"></div>

            <div class="absolute bottom-0 left-0 p-8 w-full">
                <div class="max-w-6xl mx-auto flex justify-between items-end gap-4">
                    <div class="w-full">
                        <h1 class="text-5xl font-extrabold text-primary drop-shadow-md mb-4">{{ group.groupName }} </h1>
                        <div class="flex gap-2 mb-2">
                            <span v-for="tag in group.tags" :key="tag" class="badge badge-soft badge-primary">#{{ tag }}</span>
                        </div>
                    </div>
                    
                    <div class="card-actions justify-end items-center flex-nowrap gap-3 mb-2" v-if="myUserId">
                        
                        <button @click="handleSave" class="btn btn-circle bg-white btn-primary text-red-600 shadow-lg border-0 hover:bg-gray-100" :disabled="saveLoading">
                            <svg v-if="isSaved" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"><path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" /></svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                        </button>
                        
                        <button class="btn btn-circle bg-white btn-primary text-primary shadow-lg border-0 hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </button>

                        <button @click="handleJoin" class="btn btn-circle transition-all duration-300 shadow-lg border-0" :class="isJoined ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white hover:bg-gray-100 text-primary'" :disabled="joinLoading">
                            <span v-if="joinLoading" class="loading loading-spinner loading-xs"></span>
                            <svg v-else-if="isJoined" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-3 gap-8">
            <div class="col-span-2 space-y-6">
                <div class="card bg-base-100 shadow-xl p-6">
                    <h2 class="text-2xl font-bold mb-4">Description</h2>
                    <p class="text-lg leading-relaxed text-gray-700">{{ group.description }}</p>
                </div>
            </div>
            <div class="space-y-6">
                <div class="card bg-base-100 shadow-xl p-6">
                    <h3 class="font-bold text-gray-500 text-sm mb-4">Details</h3>
                    <div class="flex items-center gap-3 mb-3"><span class="font-semibold">👥 Members: </span><span>{{ group.members ? group.members.length : 0 }}</span></div>
                    <div class="flex items-start gap-3 mb-3"><span class="font-semibold shrink-0">📅 Frequency:</span><span>{{ group.frequency }}</span></div>
                    <div class="flex items-start gap-3 mb-3"><span class="font-semibold shrink-0">⏳ Duration:</span><span>{{ group.duration }}</span></div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="showToast" class="toast toast-bottom toast-end z-50">
        <div class="alert shadow-lg" :class="toastType === 'success' ? 'alert-success text-white' : 'alert-info text-white'">
            <span>{{ toastMessage }}</span>
        </div>
    </div>
</template>
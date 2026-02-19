<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

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

const showEditModal = ref(false);
const editLoading = ref(false);
const editForm = ref({
    description: '',
    imageUrl: '',
    tags: '',
    duration: '',
    frequency: ''
});

const isCreator = computed(() => {
    return group.value && group.value.createdBy === myUserId;
});

const isJoined = computed(() => {
    if (!group.value || !group.value.members) return false;
    return group.value.members.some(m => {
        if (typeof m === 'string') return m === myUserId;
        return m.userId === myUserId || m._id === myUserId;
    });
});

const goToGroupChat = () => {
    if (group.value.chatId) {
        router.push(`/chat?id=${group.value.chatId}`);
    } else {
        alert("Error: Group chat not found.");
    }
};

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
        if (!groupId || groupId === 'undefined') throw new Error("Invalid Group ID");

        const response = await fetch(`http://localhost:8080/api/v1/groups/${groupId}`);
        if (!response.ok) throw new Error("Group not found");

        group.value = await response.json();
    } catch (err) {
        console.error("Fetch error:", err);
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

        if (!response.ok) throw new Error("Error updating favorites");
        isSaved.value = !isSaved.value;
        triggerToast(isSaved.value ? "Group saved!" : "Group removed from favorites", "success");
    } catch (error) {
        triggerToast("Error saving group", "error");
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

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Operation error");
        }

        if (action === 'join') {
            group.value.members.push({ userId: myUserId });
            triggerToast("You joined the group!", "success");
        } else {
            group.value.members = group.value.members.filter(m => {
                const id = (typeof m === 'string') ? m : (m.userId || m._id);
                return id !== myUserId;
            });
            triggerToast("You left the group", "info");
        }
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        joinLoading.value = false;
    }
};

const openEditModal = () => {
    editForm.value = {
        description: group.value.description || '',
        imageUrl: group.value.imageUrl || '',
        tags: group.value.tags ? group.value.tags.join(', ') : '',
        duration: group.value.duration || '',
        frequency: group.value.frequency || ''
    };
    showEditModal.value = true;
};

const saveGroupChanges = async () => {
    editLoading.value = true;
    try {
        const targetId = group.value.groupId || group.value._id || route.params.id;
        
        const tagsArray = editForm.value.tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        const payload = {
            description: editForm.value.description,
            imageUrl: editForm.value.imageUrl,
            tags: tagsArray,
            duration: editForm.value.duration,
            frequency: editForm.value.frequency
        };

        const res = await fetch(`http://localhost:8080/api/v1/groups/${targetId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Error updating the group");

        const updatedGroup = await res.json();
        
        group.value.description = updatedGroup.description;
        group.value.imageUrl = updatedGroup.imageUrl;
        group.value.tags = updatedGroup.tags;
        group.value.duration = updatedGroup.duration;
        group.value.frequency = updatedGroup.frequency;

        showEditModal.value = false;
        triggerToast("Group updated successfully!", "success");

    } catch (error) {
        triggerToast(error.message, "error");
    } finally {
        editLoading.value = false;
    }
};

// DELETE GROUP FUNCTION ----------------------
const deleteGroup = async () => {
    const confirmed = confirm("WARNING: Are you sure you want to permanently delete this group? This action cannot be undone.");
    if (!confirmed) return;

    try {
        const targetId = group.value.groupId || group.value._id || route.params.id;
        const res = await fetch(`http://localhost:8080/api/v1/groups/${targetId}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to delete the group.");
        }

        alert("Group deleted successfully.");
        router.push('/');
    } catch (error) {
        alert("Error: " + error.message);
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
        <h2 class="text-2xl font-bold text-red-500 mb-2">Error</h2>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <router-link to="/" class="btn btn-primary text-white">
            Return to Home
        </router-link>
    </div>

    <div v-else-if="group" class="min-h-screen bg-base-200 pb-10">   
        <div class="relative w-full h-96">
            <img :src="group.imageUrl || group.groupImage" alt="Group" class="w-full h-full object-cover"/>
            <div class="absolute inset-0 bg-gradient-to-t from-base-200 to-transparent"></div>

            <div class="absolute bottom-0 left-0 p-8 w-full">
                <div class="max-w-6xl mx-auto flex justify-between items-end gap-4">
                    <div class="w-full">
                        <h1 class="text-5xl font-extrabold text-primary drop-shadow-md mb-4">{{ group.groupName }}</h1>
                        <div class="flex gap-2 mb-2">
                            <span v-for="tag in group.tags" :key="tag" class="badge badge-soft badge-primary">#{{ tag }}</span>
                        </div>
                    </div>
                    
                    <div class="card-actions justify-end items-center flex-nowrap gap-3 mb-2" v-if="myUserId">
                        
                        <button v-if="isCreator" @click="openEditModal" class="btn btn-circle bg-white text-gray-800 shadow-lg border-0 hover:bg-gray-100" title="Edit Group">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>

                        <button @click="handleSave" class="btn btn-circle bg-white btn-primary text-red-600 shadow-lg border-0 hover:bg-gray-100" :disabled="saveLoading">
                            <svg v-if="isSaved" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6"><path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" /></svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                        </button>
                        
                        <button v-if="isJoined" @click="goToGroupChat" class="btn btn-circle bg-white btn-primary text-primary shadow-lg border-0 hover:bg-gray-100">
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

    <div v-if="showEditModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 class="font-bold text-lg">Edit Group</h3>
                <button @click="showEditModal = false" class="btn btn-sm btn-ghost btn-circle">✕</button>
            </div>
            
            <div class="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
                <div class="form-control flex flex-col w-full">
                    <label class="label justify-start"><span class="label-text font-bold">Image (URL)</span></label>
                    <input v-model="editForm.imageUrl" type="text" class="input input-bordered w-full" />
                </div>
                
                <div class="form-control flex flex-col w-full">
                    <label class="label justify-start"><span class="label-text font-bold">Description</span></label>
                    <textarea v-model="editForm.description" class="textarea textarea-bordered h-24 w-full"></textarea>
                </div>

                <div class="form-control flex flex-col w-full">
                    <label class="label justify-start"><span class="label-text font-bold">Tags (separated by comma)</span></label>
                    <input v-model="editForm.tags" type="text" class="input input-bordered w-full" />
                </div>

                <div class="flex gap-4">
                    <div class="form-control flex flex-col flex-1">
                        <label class="label justify-start"><span class="label-text font-bold">Frequency</span></label>
                        <input v-model="editForm.frequency" type="text" class="input input-bordered w-full" />
                    </div>
                    <div class="form-control flex flex-col flex-1">
                        <label class="label justify-start"><span class="label-text font-bold">Duration</span></label>
                        <input v-model="editForm.duration" type="text" class="input input-bordered w-full" />
                    </div>
                </div>
            </div>

            <div class="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl">
                <button v-if="isCreator" @click="deleteGroup" class="btn btn-error text-white px-4 shadow-sm bg-red-700 border-none">
                    Delete Group
                </button>
                
                <div class="flex gap-2">
                    <button @click="showEditModal = false" class="btn px-6 btn-ghost">Cancel</button>
                    <button @click="saveGroupChanges" class="btn px-6 bg-indigo-600 hover:bg-indigo-700 text-white border-none" :disabled="editLoading">
                        <span v-if="editLoading" class="loading loading-spinner loading-sm"></span>
                        Save
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div v-if="showToast" class="toast toast-bottom toast-end z-50">
        <div class="alert shadow-lg" :class="toastType === 'success' ? 'alert-success text-white' : 'alert-error text-white'">
            <span>{{ toastMessage }}</span>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import MeetingCard from '../components/MeetingCard.vue';

// To read groupId from URL
const route = useRoute();

const group = ref(null);
const loading = ref(true);  
const joinLoading = ref(false);
const createMeetingModal = ref(null); 

// info about joined/left groups
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const myUserId = "6988e6a7c5caf3ad6a3af73b" // momentaneo
//const myUserId = "69959df4637effcfa2ea9fa1" //momentaneo

const newMeeting = ref({
    date: '',
    time: '',
    place: '',
    description: ''
});

// computed keeps isJoined updated
const isJoined = computed(() => {
    if (!group.value || !group.value.members) return false;
    
    return group.value.members.some(m => {
        if (typeof m === 'string') return m === myUserId;
        return m.userId === myUserId || m._id === myUserId;
    });
});

// check if admin
const isCreator = computed(() => {
    if (!group.value || !group.value.createdBy) return false;
    const creatorId = typeof group.value.createdBy === 'object' 
        ? group.value.createdBy.toString() 
        : group.value.createdBy;

    return creatorId === myUserId;
});

// function that shows info about joined/left groups
const triggerToast = (message, type = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;
    
    // hide after 3 seconds
    setTimeout(() => {
        showToast.value = false;
    }, 3000);
};

const fetchGroupData = async () => {
    try {
        const groupId = route.params.id;
        const response = await fetch(`http://localhost:8080/api/v1/groups/${groupId}`);

        if (!response.ok) throw new Error("Group not found");

        group.value = await response.json();
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// function for button "+"
const handleJoin = async () => {
    if (joinLoading.value || !group.value) return;
    joinLoading.value = true;

    const action = isJoined.value ? 'leave' : 'join';
    const method = isJoined.value ? 'DELETE' : 'POST';

    try {
        const response = await fetch(`http://localhost:8080/api/v1/groups/${group.value.groupId}/${action}`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: myUserId })
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.error || "Error during operation")
        }

        if (action === 'join') {
            group.value.members.push({ userId: myUserId });
            triggerToast("You joined the group!", "success");
        } else { // remove id from group
            group.value.members = group.value.members.filter(m => {
                const id = (typeof m === 'string') ? m : (m.userId || m._id);
                return id !== myUserId;
            });
            triggerToast("You left the group", "info");
        }

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    } finally {
        joinLoading.value = false;
    }
};


// create meeting
const createMeeting = async () => {
    if (!newMeeting.value.date || !newMeeting.value.time) {
        triggerToast("Please select both date and time", "error");
        return;
    }

    try {
            const res = await fetch(`http://localhost:8080/api/v1/groups/${group.value.groupId}/meetings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: myUserId,
                date: newMeeting.value.date, 
                time: newMeeting.value.time, 
                place: newMeeting.value.place,
                description: newMeeting.value.description
            })
        });

        if (res.ok) {
            newMeeting.value = { date: '', time: '', place: '', description: '' }; // Reset
            createMeetingModal.value.close();

            triggerToast("Meeting successfully created!", "success");
            await fetchGroupData(); // Refresh data
        } else {
            const errData = await res.json();
            throw new Error(errData.error || "Error during creation");        }
    } catch (e) {
        triggerToast("Errore during meeting creation", "error");
    }
};

// vote/propose change
const handleVote = async ({ meetingId, response, changeProposal }) => {
    try {
        const gid = group.value.groupId;
        const body = { userId: myUserId, response }; 
        if (changeProposal) body.changeProposal = changeProposal;

        const res = await fetch(`http://localhost:8080/api/v1/groups/${gid}/meetings/${meetingId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            triggerToast("Vote saved!", "success");
            await fetchGroupData();
        }
    } catch (e) {
        console.error(e);
    }
};

// admin can update status of meeting
const handleStatusUpdate = async (meetingId, newStatus) => {
    try {
        const res = await fetch(`http://localhost:8080/api/v1/groups/${group.value.groupId}/meetings/${meetingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: myUserId, status: newStatus })
        });
        if (res.ok) await fetchGroupData();
    } catch (e) {
        console.error(e);
    }
};

// admin permanently deletes meeting
const handleDelete = async (meetingId) => {
    if(!confirm("Do you really want to delete the meeting?")) return;
    try {
        const res = await fetch(`http://localhost:8080/api/v1/groups/${group.value.groupId}/meetings/${meetingId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: myUserId })
        });
        
        if (res.ok) {
            triggerToast("Meeting deleted", "info");
            if(group.value.meetings) {
                group.value.meetings = group.value.meetings.filter(m => m.meetingId !== meetingId);
            }
        }
    } catch (e) {
        console.error(e);
    }
};

onMounted(() => {
    fetchGroupData();
});
</script>

<template>
    <div v-if="group" class="min-h-screen bg-base-200 pb-10">   
        <div class="relative w-full h-96">
            <img
                :src="group.imageUrl"
                alt="Group photo"
                class="w-full h-full object-cover"
             />
            <!-- makes the image gradient -->
            <div class="absolute inset-0 bg-gradient-to-t from-base-200 to-transparent"></div>

            <div class="absolute bottom-0 left-0 p-8 w-full">
                <div class="max-w-6xl mx-auto flex justify-between items-end gap-4">
                    <div class="w-full">
                        <h1 class="text-5xl font-extrabold text-primary drop-shadow-md mb-4">{{ group.groupName }} </h1>

                        <div class="flex gap-2 mb-2">
                            <span v-for="tag in group.tags" :key="tag" class="badge badge-soft badge-primary">#{{ tag }}</span>
                        </div>
                    </div>
                    <div class="flex gap-3 shrink-0 mb-1">
                        <div class="card-actions justify-end gap-2 pt-4 mt-4">
                            <!-- bottone "<3"-->
                            <button class="btn btn-circle bg-white btn-primary text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-[1.2em]"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                            </button>
                            <!-- bottone "chat"-->
                            <button class="btn btn-circle bg-white btn-primary text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            </button>
                            <!-- bottone "+"-->
                            <button @click="handleJoin" class="btn btn-circle transition-all duration-300 btn-primary"
                            :class="isJoined ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white '"
                            :disabled="joinLoading"
                            >
                                <span v-if="joinLoading" class="loading loading-spinner loading-xs"></span>

                                <svg v-else-if="isJoined" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                 </svg>

                                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-3 gap-8">
            <!-- description card -->
            <div class="col-span-2 space-y-6">
                <div class="card bg-base-100 shadow-xl p-6">
                    <h2 class="text-2xl font-bold mb-4">Description</h2>
                    <p class="text-lg leading-relaxed text-gray-700">
                        {{ group.description }}
                    </p>
                </div>
                <div class="mt-8">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold">Meetings</h2>
                        <button v-if="isCreator" @click="createMeetingModal.showModal()" class="btn btn-sm bg-green-400 hover:bg-green-500 px-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            New meeting
                        </button>
                    </div>

                    <div v-if="group.meetings && group.meetings.length > 0">
                        <MeetingCard 
                            v-for="meeting in group.meetings"
                            :key="meeting.meetingId"
                            :meeting="meeting"
                            :isCreator="isCreator"
                            :myUserId="myUserId"
                            :isMember="isJoined"
                            @vote="handleVote"
                            @confirm="(id) => handleStatusUpdate(id, 'confirmed')"
                            @reject="(id) => handleStatusUpdate(id, 'rejected')"
                            @delete="handleDelete"
                        />
                    </div>
                    <div v-else class="text-center py-10 text-gray-400 bg-base-100 rounded-xl border-dashed border-2">
                        No meetings planned
                    </div>
                </div>
            </div>

            <!-- details card -->
            <div class="space-y-6">
                <div class="card bg-base-100 shadow-xl p-6">
                    <h3 class="font-bold text-gray-500 text-sm mb-4">Details</h3>
                    
                    <div class="flex items-center gap-3 mb-3">
                        <span class="font-semibold">👥 Members: </span>
                        <span>
                            {{ group.members ? group.members.length : 0 }}
                        </span>
                    </div>

                    <div class="flex items-start gap-3 mb-3">
                        <span class="font-semibold shrink-0">📅 Frequency:</span>
                        <span>{{ group.frequency }}</span>
                    </div>
                    
                    <div class="flex items-start gap-3 mb-3">
                        <span class="font-semibold shrink-0">⏳ Duration:</span>
                        <span>{{ group.duration }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="min-h-screen flex justify-center items-center">
        <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- toast for info about joined/left group-->
    <div v-if="showToast" class="toast toast-bottom toast-end z-50">
        <div class="alert shadow-lg" :class="toastType === 'success' ? 'alert-success text-white' : 'alert-info text-white'">
            <svg v-if="toastType === 'success'" xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>

            <span>{{ toastMessage }}</span>
        </div>
    </div>

    <dialog ref="createMeetingModal" id="create_modal" class="modal">
        <div class="modal-box">
            <h3 class="font-bold text-lg">Create New Meeting</h3>
            
            <div class="py-4 space-y-4">
                <input type="date" v-model="newMeeting.date" class="input input-bordered w-full" />
                <input type="time" v-model="newMeeting.time" class="input input-bordered w-full" />
                <input type="place" placeholder="e.g Library" v-model="newMeeting.place" class="input input-bordered w-full" />
                <textarea placeholder="Description" v-model="newMeeting.description" class="textarea textarea-bordered w-full"></textarea>
            </div>

            <div class="modal-action">
                <form method="dialog">
                    <button class="btn btn-primary bg-rose-400 hover:bg-rose-500 px-2">Close</button>
                </form>
                <button class="btn btn-primary bg-green-400 hover:bg-green-500 px-2" @click="createMeeting">Create</button>
            </div>
        </div>
    </dialog>
</template>
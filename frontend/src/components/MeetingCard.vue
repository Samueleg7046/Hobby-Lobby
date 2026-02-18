<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
    meeting: Object,
    isCreator: Boolean, // True if logged user is admin
    myUserId: String  // momentaneo
});

const emit = defineEmits(['vote', 'confirm', 'reject', 'delete', 'edit']);
const loading = ref(false);
const showProposals = ref(false); // Toggle to see details of proposals

// check status of meeting
const isConfirmed = computed(() => props.meeting.status === 'confirmed');
const isRejected = computed(() => props.meeting.status === 'rejected');
const isPending = computed(() => props.meeting.status === 'pending');

// User vote
const myVote = computed(() => {
    if (!props.meeting.memberVotes) return null;
    const voteRecord = props.meeting.memberVotes.find(v => {
        const idToCheck = (typeof v.userId === 'string') ? v.userId : v.userId._id;
        return idToCheck === props.myUserId;
    });
    return voteRecord ? voteRecord.response : null; 
});

// Counter for proposals to modify meeting details
const proposalsCount = computed(() => {
    return props.meeting.currentVotes?.proposedChange || 0;
});

// Shows proposed changes
const changeProposalsList = computed(() => {
    return props.meeting.memberVotes.filter(v => v.response === 'proposedChange' && v.changeProposal) || [];
});

// --- For user ---
// user vote
const handleVote = (responseType) => {
    if (loading.value) return;
    emit('vote', { meetingId: props.meeting.meetingId, response: responseType });
};

// User proposes changes
const isProposing = ref(false);
const proposalForm = ref({ date: '', time: '', place: '' });

const submitProposal = () => {
    emit('vote', { 
        meetingId: props.meeting.meetingId, 
        response: 'proposedChange', 
        changeProposal: { ...proposalForm.value }
    });
    isProposing.value = false;
};

// --- For admin ---
const confirmMeeting = () => emit('confirm', props.meeting.meetingId);
const rejectMeeting = () => emit('reject', props.meeting.meetingId);
const deleteMeeting = () => emit('delete', props.meeting.meetingId);
</script>

<template>
    <div class="card bg-base-100 shadow-md border border-base-200 mb-6 transition-all hover:shadow-lg">
        
        <div class="h-2 w-full" :class="{
            'bg-success': isConfirmed,
            'bg-error': isRejected,
            'bg-warning': isPending
        }"></div>
        <!--DEBUG-->
<pre class="text-xs bg-gray-100 p-2">{{ meeting }}</pre>
        <div class="card-body p-5">
            <div class="flex justify-between items-start">
                <div class="flex gap-4">
                    <div class="flex flex-col items-center bg-base-200 p-2 rounded-lg min-w-[60px]">
                        <span class="text-xs font-bold uppercase text-gray-500">{{ new Date(meeting.date).toLocaleString('it-IT', { month: 'short' }) }}</span>
                        <span class="text-2xl font-black">{{ new Date(meeting.date).getDate() }}</span>
                    </div>
                    
                    <div>
                        <h3 class="font-bold text-lg flex items-center gap-2">
                            {{ meeting.description || 'Group meeting' }}
                            <span v-if="isConfirmed" class="badge badge-success text-white text-xs">CONFIRMED</span>
                            <span v-else-if="isRejected" class="badge badge-error text-white text-xs font-bold">CANCELLED</span>
                            <span v-else class="badge badge-warning text-xs">POLL</span>
                        </h3>
                        <div class="text-sm text-gray-500 mt-1 space-y-1">
                             <div class="flex items-center gap-2">🕒 {{ meeting.time }}</div>
                             <div class="flex items-center gap-2">📍 {{ meeting.place || 'To be defined' }}</div>
                        </div>
                    </div>
                </div>

                <div v-if="!isRejected" class="stats stats-vertical shadow-sm text-xs bg-base-200">
                    <div class="stat p-2 place-items-center">
                        <div class="stat-value text-success text-lg">{{ meeting.currentVotes?.confirmed || 0 }}</div>
                        <div class="stat-desc">Yes</div>
                    </div>
                    <div class="stat p-2 place-items-center">
                        <div class="stat-value text-error text-lg">{{ meeting.currentVotes?.rejected || 0 }}</div>
                        <div class="stat-desc">No</div>
                    </div>
                </div>
            </div>

            <div v-if="isPending && proposalsCount > 0" class="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div class="flex justify-between items-center cursor-pointer" @click="showProposals = !showProposals">
                    <span class="text-sm font-bold text-yellow-800">
                        ⚠️ There are {{ proposalsCount }} change proposals
                    </span>
                    <span class="text-xs underline text-yellow-600">{{ showProposals ? 'Hide' : 'Show' }}</span>
                </div>
                
                <div v-if="showProposals" class="mt-2 space-y-2">
                    <div v-for="(prop, idx) in changeProposalsList" :key="idx" class="text-xs bg-white p-2 rounded border"> 
                        <strong>Proposal:</strong>
                        <span v-if="prop.changeProposal.date"> date: {{ prop.changeProposal.date }} </span>
                        <span v-if="prop.changeProposal.time">time: {{ prop.changeProposal.time }} </span>
                        <span v-if="prop.changeProposal.place">place: {{ prop.changeProposal.place }}</span>
                    </div>
                </div>
            </div>

            <div class="divider my-1"></div>

            <div v-if="isCreator" class="flex flex-wrap gap-2 justify-end">
                <button @click="deleteMeeting" class="btn btn-sm btn-primary bg-red-400 hover:bg-red-500 px-2">Delete Permanently</button>
                
                <div v-if="isPending" class="flex gap-2">
                    <button @click="rejectMeeting" class="btn btn-sm btn-primary bg-yellow-400 hover:bg-yellow-500 px-2">
                        ❌ Cancel Meeting
                    </button>
                    <button @click="confirmMeeting" class="btn btn-sm btn-primary px-2 bg-green-400 hover:bg-green-500 ">
                        ✅ Confirm Meeting
                    </button>
                </div>
                <div v-else class="text-xs text-gray-500 self-center font-mono">
                    Meeting Closed
                </div>
            </div>

            <div v-else>
                <div v-if="isPending">
                    <div v-if="!isProposing" class="flex justify-end gap-2">
                        <button @click="handleVote('rejected')" 
                            class="btn btn-sm" :class="myVote === 'rejected' ? 'btn-primary bg-rose-400 hover:bg-rose-500 px-2 text-white' : 'btn-ghost px-2'">
                            Reject
                        </button>
                        <button @click="isProposing = true" 
                            class="btn btn-sm" :class="myVote === 'proposedChange' ? 'btn-primary bg-yellow-400 hover:bg-yellow-500 px-2' : 'btn-ghost px-2'">
                            Propose Change
                        </button>
                        <button @click="handleVote('confirmed')" 
                            class="btn btn-sm" :class="myVote === 'confirmed' ? 'btn-primary bg-green-400 hover:bg-green-500 px-2 text-white' : 'btn-outline bg-green-400 hover:bg-green-500 px-2'">
                            Confirm
                        </button>
                    </div>

                    <div v-else class="bg-base-200 p-3 rounded-lg animate-fade-in">
                        <p class="text-sm font-bold mb-2">What would you like to change?</p>
                        <div class="grid grid-cols-2 gap-2 mb-2">
                            <input v-model="proposalForm.date" type="date" class="input input-sm input-bordered w-full">
                            <input v-model="proposalForm.time" type="time" class="input input-sm input-bordered w-full">
                        </div>
                        <input v-model="proposalForm.place" type="text" class="input input-sm input-bordered w-full mb-2">
                        
                        <div class="flex justify-end gap-2">
                            <button @click="isProposing = false" class="btn btn-xs btn-ghost">Cancel</button>
                            <button @click="submitProposal" class="btn btn-xs btn-primary">Send Proposal</button>
                        </div>
                    </div>
                </div>
                
                <div v-else class="text-center font-medium py-1">
                    <span v-if="isConfirmed" class="text-success flex justify-center items-center gap-2">
                        Meeting is confirmed. See you there!
                    </span>
                    <span v-else class="text-error flex justify-center items-center gap-2">
                        The meeting was cancelled by the admin.
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>
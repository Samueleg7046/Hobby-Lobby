<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import UserCard from '../components/UserCard.vue';
import GroupCard from '../components/GroupCard.vue';

const route = useRoute();
const router = useRouter();

const user = ref(null);
const allGroups = ref([]); 
const loading = ref(true);
const activeTab = ref('joined');
const myUserId = localStorage.getItem('userId');

// FRIEND SEARCH ------------------------------
const searchQuery = ref('');
const searchResult = ref(null);
const searchLoading = ref(false);
const searchError = ref(null);
const requestSent = ref(false);
const pendingRequests = ref([]);

const isMyProfile = computed(() => {
    return user.value && myUserId && user.value._id === myUserId;
});

// ID HELPER --------------------
const getIdFromGroup = (g) => {
    if (g._id) return g._id;
    if (g.id) return g.id;
    if (g.self) return g.self.split('/').pop();
    return null;
};

// COMPUTED PROPERTIES ----------------------
const joinedGroups = computed(() => {
  if (!user.value || !allGroups.value.length) return [];
  const targetId = user.value._id;
  return allGroups.value.filter(g => g.members && g.members.some(m => {
        if (typeof m === 'string') return m === targetId;
        return (m.userId === targetId) || (m._id === targetId);
    }));
});

const savedGroups = computed(() => {
  if (!user.value || !user.value.savedGroups || !allGroups.value.length) return [];
  const savedIds = user.value.savedGroups.map(g => (typeof g === 'string') ? g : g._id);
  return allGroups.value.filter(group => savedIds.includes(getIdFromGroup(group)));
});

const friends = computed(() => user.value?.savedFriends || []);
const stats = computed(() => ({
  groups: joinedGroups.value.length,
  friends: friends.value.length
}));

// FETCH FUNCTIONS ----------------------
const loadData = async () => {
    loading.value = true;
    const userId = route.params.id;
    try {
        const userRes = await fetch(`http://localhost:8080/api/v1/users/${userId}`);
        if (!userRes.ok) throw new Error('User not found');
        user.value = await userRes.json();

        const groupsRes = await fetch('http://localhost:8080/api/v1/groups/feed');
        if (groupsRes.ok) allGroups.value = await groupsRes.json();
    } catch (err) { 
        console.error(err); 
    } finally { 
        loading.value = false; 
    }
};

// FRIEND SEARCH FUNCTIONS --------------
const handleSearchFriend = async () => {
    if (!searchQuery.value) return;
    searchLoading.value = true;
    searchError.value = null;
    searchResult.value = null;
    requestSent.value = false;
    
    try {
        const res = await fetch(`http://localhost:8080/api/v1/users/search/handle?query=${searchQuery.value}`);
        if (res.status === 404) throw new Error("No user found with this username.");
        if (!res.ok) throw new Error("Search error.");
        
        const data = await res.json();
        if (data._id === myUserId) throw new Error("That's you! You cannot add yourself.");
        if (friends.value.some(f => f._id === data._id)) throw new Error("You are already friends.");
        
        searchResult.value = data;
    } catch (err) {
        searchError.value = err.message;
    } finally {
        searchLoading.value = false;
    }
};

const sendFriendRequest = async () => {
    if (!searchResult.value) return;
    try {
        const res = await fetch('http://localhost:8080/api/v1/friends/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                requesterId: myUserId, 
                recipientId: searchResult.value._id 
            })
        });

        const data = await res.json();
        if (!res.ok) {
            if (res.status === 409) {
                 alert("Request already sent or pending!");
                 requestSent.value = true;
                 return;
            }
            throw new Error(data.message);
        }

        requestSent.value = true;
    } catch (err) {
        alert("Error: " + err.message);
    }
};

const loadPendingRequests = async () => {
    if (!isMyProfile.value) return; 
    try {
        const res = await fetch(`http://localhost:8080/api/v1/friends/requests/${myUserId}`);
        if (res.ok) {
            pendingRequests.value = await res.json();
        }
    } catch (error) {
        console.error("Error loading requests:", error);
    }
};

const handleResponse = async (requestId, action, requester) => {
    try {
        const res = await fetch(`http://localhost:8080/api/v1/friends/respond/${requestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });

        if (!res.ok) throw new Error("Operation error");
        pendingRequests.value = pendingRequests.value.filter(req => req._id !== requestId);
        
        if (action === 'accept' && requester) {
            if (!user.value.savedFriends) user.value.savedFriends = [];
            user.value.savedFriends.push(requester);
        }
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// REMOVE FRIEND FUNCTION ----------------------
const removeFriend = async (friendId) => {
    if (!confirm("Are you sure you want to remove this user from your friends?")) return;
    try {
        const res = await fetch(`http://localhost:8080/api/v1/users/${myUserId}/friends/${friendId}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            if (user.value && user.value.savedFriends) {
                user.value.savedFriends = user.value.savedFriends.filter(f => f._id !== friendId);
            }
        }
    } catch (e) {
        console.error(e);
    }
};

// DELETE ACCOUNT FUNCTION ----------------------
const deleteAccount = async () => {
    const confirmed = confirm("WARNING: Do you really want to permanently delete your account? You will lose all your data.");
    if (!confirmed) return;

    try {
        const res = await fetch(`http://localhost:8080/api/v1/users/${myUserId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            localStorage.clear();
            alert("Your account has been permanently deleted.");
            router.push('/login');
        } else {
            alert("Error deleting the account.");
        }
    } catch (e) {
        console.error("Network error:", e);
    }
};

watch(activeTab, (newTab) => {
    if (newTab === 'friends' && isMyProfile.value) {
        loadPendingRequests();
    }
});

onMounted(async () => {
    await loadData();
    if (activeTab.value === 'friends' && isMyProfile.value) {
        loadPendingRequests();
    }
});

watch(() => route.params.id, () => {
    searchQuery.value = '';
    searchResult.value = null;
    loadData();
});

</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-10">
    <div class="container mx-auto max-w-4xl p-4">

      <div v-if="loading" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="user">
        
        <UserCard 
            :user="user"
            :stats="stats" 
            :isMyProfile="isMyProfile" 
            @updateUser="(updatedData) => user = updatedData"
        />

        <div role="tablist" class="tabs tabs-boxed bg-white p-2 mb-6 shadow-sm border border-gray-200">
            <a role="tab" class="tab" :class="{ 'tab-active bg-indigo-500 text-white font-bold': activeTab === 'joined' }" @click="activeTab = 'joined'">Joined ({{ joinedGroups.length }})</a>
            <a role="tab" class="tab" :class="{ 'tab-active bg-indigo-500 text-white font-bold': activeTab === 'saved' }" @click="activeTab = 'saved'">Saved ({{ savedGroups.length }})</a>
            <a role="tab" class="tab" :class="{ 'tab-active bg-indigo-500 text-white font-bold': activeTab === 'friends' }" @click="activeTab = 'friends'">Friends ({{ friends.length }})</a>
        </div>

        <div v-if="activeTab === 'joined'" class="flex flex-col gap-4 animate-fade-in">
            <div v-if="joinedGroups.length === 0" class="text-center py-10 text-gray-500">You are not part of any group.</div>
            <GroupCard v-for="group in joinedGroups" :key="getIdFromGroup(group)" :id="getIdFromGroup(group)" 
                :title="group.groupName" :description="group.description" :image="group.imageUrl || group.groupImage" 
                :tags="group.tags" :members="group.members" :myUserId="myUserId" />
        </div>

        <div v-if="activeTab === 'saved'" class="flex flex-col gap-4 animate-fade-in">
            <div v-if="savedGroups.length === 0" class="text-center py-10 text-gray-500">No saved groups.</div>
            <GroupCard v-for="group in savedGroups" :key="getIdFromGroup(group)" :id="getIdFromGroup(group)" 
                :title="group.groupName" :description="group.description" :image="group.imageUrl || group.groupImage" 
                :tags="group.tags" :members="group.members" :myUserId="myUserId" />
        </div>

        <div v-if="activeTab === 'friends'" class="animate-fade-in">
            
            <div v-if="isMyProfile" class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h3 class="font-bold text-gray-800 mb-3 text-lg">Add new friends</h3>
                <div class="flex gap-2">
                    <input 
                        v-model="searchQuery" 
                        @keyup.enter="handleSearchFriend"
                        type="text" 
                        placeholder="Search username (e.g. luigi)" 
                        class="input input-bordered w-full focus:outline-none focus:border-indigo-500" 
                    />
                    <button 
                        @click="handleSearchFriend" 
                        class="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none px-6" 
                        :disabled="searchLoading"
                    >
                        <span v-if="searchLoading" class="loading loading-spinner"></span>
                        <span v-else>Search</span>
                    </button>
                </div>

                <p v-if="searchError" class="text-red-500 text-sm mt-2 font-medium">{{ searchError }}</p>

                <div v-if="searchResult" class="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                         <img :src="searchResult.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'" class="w-12 h-12 rounded-full border border-white shadow-sm object-cover">
                         <div>
                             <p class="font-bold text-gray-900">{{ searchResult.displayName }}</p>
                             <p class="text-xs text-gray-500">@{{ searchResult.uniqueName }}</p>
                         </div>
                    </div>
                    
                    <div>
                        <button v-if="!requestSent" @click="sendFriendRequest" class="btn px-4 btn-sm bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all">
                            Send Request
                        </button>
                        <span v-else class="text-green-600 font-bold text-sm flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                            Sent
                        </span>
                    </div>
                </div>
            </div>

            <div v-if="isMyProfile && pendingRequests.length > 0" class="mb-8">
                <h3 class="font-bold text-gray-800 mb-3 text-lg flex items-center gap-2">
                    Pending Requests
                    <span class="badge badge-primary badge-sm text-white">{{ pendingRequests.length }}</span>
                </h3>
                
                <div class="flex flex-col gap-3">
                    <div v-for="req in pendingRequests" :key="req._id" class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <img :src="req.requester.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'" class="w-12 h-12 rounded-full object-cover">
                            <div>
                                <p class="font-bold text-gray-900">{{ req.requester.displayName }}</p>
                                <p class="text-xs text-gray-500">wants to be your friend</p>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button @click="handleResponse(req._id, 'accept', req.requester)" class="btn px-6 btn-sm bg-green-600 text-white hover:bg-green-700 border-none shadow-sm">
                                Accept
                            </button>
                            <button @click="handleResponse(req._id, 'reject', null)" class="btn px-4 btn-sm bg-gray-200 text-gray-700 hover:bg-gray-300 border-none shadow-sm">
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
                <div class="divider"></div>
            </div>

            <div v-if="friends.length === 0" class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p class="text-gray-500">You haven't added any friends yet.</p>
                <p class="text-sm text-gray-400 mt-1">Use the search bar above to find them!</p>
            </div>
            
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="friend in friends" :key="friend._id" class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between transition-shadow hover:shadow-md">
                    <div class="flex items-center gap-3">
                        <img :src="friend.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'" class="w-12 h-12 rounded-full object-cover border border-gray-100">
                        <div>
                            <p class="font-bold text-gray-900">{{ friend.displayName }}</p>
                            <p class="text-xs text-gray-500">@{{ friend.uniqueName }}</p>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <button 
                            v-if="isMyProfile" 
                            @click="removeFriend(friend._id)" 
                            class="btn px-6 btn-sm bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
                        >
                            Remove
                        </button>
                        <button 
                            @click="router.push(`/user/${friend._id}`)" 
                            class="btn px-6 btn-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none shadow-sm"
                        >
                            Visit Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="isMyProfile" class="mt-12 pt-8 border-t border-gray-200 flex flex-col items-center">
            <h3 class="font-bold text-red-600 mb-4 text-xl">Danger Zone</h3>
            <button @click="deleteAccount" class="btn bg-red-600 hover:bg-red-700 text-white border-none w-full max-w-sm shadow-md">
                Permanently Delete Account
            </button>
            <p class="text-xs text-gray-400 mt-2 text-center max-w-sm">
                Once you delete your account, there is no going back. Please be certain.
            </p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>
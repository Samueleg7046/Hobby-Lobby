<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const router = useRouter();

// AUTH CHECK
const myUserId = localStorage.getItem('userId');

const chats = ref([]);
const activeChat = ref(null);
const messages = ref([]);
const newMessage = ref('');
const loading = ref(false);
const loadingMessages = ref(false);

// --- STATO PER NUOVA CHAT (MODIFICATO) ---
const showNewChatModal = ref(false);
const friendsList = ref([]);
const friendSearchQuery = ref(''); 
const loadingFriends = ref(false);

//load chats
const loadChats = async () => {
    if (!myUserId) return;
    loading.value = true;
    try {
        const res = await fetch(`${API_URL}/chats/user/${myUserId}`);
        if (res.ok) {
            chats.value = await res.json();
            const requestedChatId = route.query.id;
            if (requestedChatId) {
                const targetChat = chats.value.find(c => c._id === requestedChatId);
                if (targetChat) {
                    selectChat(targetChat);
                }
            }
        }
    } catch (e) { console.error(e); } 
    finally { loading.value = false; }
};
const openNewChatModal = async () => {
    showNewChatModal.value = true;
    loadingFriends.value = true;
    friendsList.value = [];
    
    try {
        const res = await fetch(`${API_URL}/users/${myUserId}/friends`);
        if (res.ok) {
            friendsList.value = await res.json();
        }
    } catch (e) { console.error(e); }
    finally { loadingFriends.value = false; }
};

const selectChat = async (chat) => {
    activeChat.value = chat;
    loadingMessages.value = true;
    messages.value = []; 
    try {
        const res = await fetch(`${API_URL}/chats/${chat._id}/messages`);
        if (res.ok) {
            messages.value = await res.json();
            scrollToBottom();
        }
    } catch (e) { console.error(e); } 
    finally { loadingMessages.value = false; }
};

const sendMessage = async () => {
    if (!newMessage.value.trim() || !activeChat.value) return;
    const content = newMessage.value;
    newMessage.value = ''; 

    try {
        const res = await fetch(`${API_URL}/chats/${activeChat.value._id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: myUserId, content })
        });

        if (res.ok) {
            const savedMsg = await res.json();
            messages.value.push(savedMsg);
            scrollToBottom();
            
            const chatIndex = chats.value.findIndex(c => c._id === activeChat.value._id);
            if (chatIndex !== -1) {
                chats.value[chatIndex].lastMessage = savedMsg;
                chats.value[chatIndex].updatedAt = new Date().toISOString();
                const updatedChat = chats.value.splice(chatIndex, 1)[0];
                chats.value.unshift(updatedChat);
            }
        }
    } catch (e) { console.error(e); }
};

const startChatWithFriend = async (friendId) => {
    try {
        const res = await fetch(`${API_URL}/chats/private`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ myId: myUserId, otherId: friendId })
        });

        if (res.ok) {
            const chat = await res.json();
            if (!chats.value.find(c => c._id === chat._id)) {
                chats.value.unshift(chat);
            }
            
            showNewChatModal.value = false;
            friendSearchQuery.value = '';
            selectChat(chat);
        } else {
            const err = await res.json();
            alert(err.error || "Errore creazione chat");
        }
    } catch (e) { console.error(e); }
};

// --- friend filter ---
const filteredFriends = computed(() => {
    if (!friendSearchQuery.value) return friendsList.value;
    const q = friendSearchQuery.value.toLowerCase();
    return friendsList.value.filter(f => 
        f.displayName.toLowerCase().includes(q) || 
        f.uniqueName.toLowerCase().includes(q)
    );
});

// UTILITY
const getChatName = (chat) => {
    if (chat.isGroup) return chat.groupName;
    const other = chat.participants.find(p => p._id !== myUserId) || chat.participants[0];
    return other?.displayName || 'Utente';
};

const getChatImage = (chat) => {
    if (chat.isGroup) return chat.groupImage;
    const other = chat.participants.find(p => p._id !== myUserId) || chat.participants[0];
    return other?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
};

const scrollToBottom = () => {
    nextTick(() => {
        const container = document.getElementById('msg-container');
        if (container) container.scrollTop = container.scrollHeight;
    });
};

onMounted(loadChats);
</script>

<template>
  <div class="h-[calc(100vh-64px)] bg-gray-100 overflow-hidden relative">
    
    <div v-if="!myUserId" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <div class="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
            <button @click="router.push('/login')" class="btn bg-indigo-600 hover:bg-indigo-700 text-white w-full">Go to Login</button>
        </div>
    </div>

    <div v-else class="flex h-full">
        <div class="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col" :class="{ 'hidden md:flex': activeChat }">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 class="font-bold text-lg text-gray-800">Messages</h2>
                <button @click="openNewChatModal" class="btn btn-sm btn-circle bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto">
                <div v-if="loading" class="flex justify-center p-4"><span class="loading loading-spinner text-primary"></span></div>
                <div v-else-if="chats.length === 0" class="p-8 text-center text-gray-400">
                    <p>No conversations.</p>
                    <button @click="openNewChatModal" class="btn btn-link text-indigo-600 no-underline">Write to a friend</button>
                </div>
                <div v-else v-for="chat in chats" :key="chat._id" @click="selectChat(chat)" class="p-3 border-b border-gray-50 cursor-pointer hover:bg-indigo-50 transition-colors flex gap-3 items-center" :class="{ 'bg-indigo-50 border-l-4 border-l-indigo-500': activeChat?._id === chat._id }">
                    <img :src="getChatImage(chat)" class="w-12 h-12 rounded-full object-cover border border-gray-200">
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-baseline">
                            <h3 class="font-bold text-gray-800 truncate">{{ getChatName(chat) }}</h3>
                            <span v-if="chat.lastMessage" class="text-[10px] text-gray-400">{{ new Date(chat.updatedAt).toLocaleDateString() }}</span>
                        </div>
                        <p class="text-sm text-gray-500 truncate"><span v-if="chat.lastMessage?.sender === myUserId">You: </span>{{ chat.lastMessage?.content || 'Start writing...' }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex-1 flex flex-col bg-slate-50 relative" :class="{ 'hidden md:flex': !activeChat }">
            <div v-if="!activeChat" class="flex-1 flex flex-col justify-center items-center text-gray-400">
                <p>Select a chat to start</p>
            </div>
            <template v-else>
                <div class="p-3 bg-white border-b border-gray-200 flex items-center gap-3 shadow-sm z-10">
                    <button @click="activeChat = null" class="md:hidden btn btn-sm btn-ghost btn-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <img :src="getChatImage(activeChat)" class="w-10 h-10 rounded-full object-cover border">
                    <h3 class="font-bold text-gray-800">{{ getChatName(activeChat) }}</h3>
                </div>
                <div id="msg-container" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    <div v-if="loadingMessages" class="flex justify-center mt-10"><span class="loading loading-spinner"></span></div>
                    <div v-for="msg in messages" :key="msg._id" class="chat" :class="msg.sender._id === myUserId ? 'chat-end' : 'chat-start'">
                        <div class="chat-image avatar" v-if="msg.sender._id !== myUserId">
                            <div class="w-8 rounded-full"><img :src="msg.sender.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'" /></div>
                        </div>
                        <div class="chat-bubble shadow-sm" :class="msg.sender._id === myUserId ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border border-gray-200'">{{ msg.content }}</div>
                        <div class="chat-footer opacity-50 text-[10px] mt-1">{{ new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</div>
                    </div>
                </div>
                <div class="p-3 bg-white border-t border-gray-200">
                    <div class="flex gap-2 items-center">
                        <input v-model="newMessage" @keyup.enter="sendMessage" type="text" placeholder="Scrivi un messaggio..." class="input input-bordered w-full focus:outline-none focus:border-indigo-500 rounded-full" />
                        <button @click="sendMessage" class="btn btn-circle bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </div>
            </template>
        </div>

        <div v-if="showNewChatModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col max-h-[80vh]">
                
                <div class="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 class="font-bold text-lg">Start new chat</h3>
                    <button @click="showNewChatModal = false" class="btn btn-sm btn-ghost btn-circle">✕</button>
                </div>

                <div class="p-3 bg-gray-50 border-b border-gray-100">
                    <input v-model="friendSearchQuery" type="text" placeholder="Search among your friends..." class="input input-bordered input-sm w-full bg-white" />
                </div>
                
                <div class="overflow-y-auto p-2 flex-1 min-h-[200px]">
                    <div v-if="loadingFriends" class="flex justify-center py-8"><span class="loading loading-spinner text-primary"></span></div>
                    
                    <div v-else-if="friendsList.length === 0" class="text-center py-8 text-gray-400">
                        <p>You don't have any friends yet.</p>
                        <p class="text-xs mt-1">Go to other users' profiles to add them!</p>
                    </div>

                    <div v-else-if="filteredFriends.length === 0" class="text-center py-8 text-gray-400">
                        <p>No friends found with this name.</p>
                    </div>

                    <div v-else class="flex flex-col gap-1">
                        <div v-for="friend in filteredFriends" :key="friend._id" 
                             @click="startChatWithFriend(friend._id)"
                             class="flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors">
                            
                            <img :src="friend.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'" class="w-10 h-10 rounded-full border border-gray-200 object-cover">
                            
                            <div class="flex-1">
                                <p class="font-bold text-gray-800">{{ friend.displayName }}</p>
                                <p class="text-xs text-gray-500">@{{ friend.uniqueName }}</p>
                            </div>
                            
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                        </div>
                    </div>
                </div>

            </div>
        </div>

    </div>
  </div>
</template>
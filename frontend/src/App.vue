<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { ref, watch } from 'vue';

const route = useRoute();
const router = useRouter();

const isLoggedIn = ref(false);
const myUserId = ref(null);

const checkAuth = () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  if (token && userId) {
    isLoggedIn.value = true;
    myUserId.value = userId;
  } else {
    isLoggedIn.value = false;
    myUserId.value = null;
  }
};

const logout = () => {
  localStorage.clear();
  isLoggedIn.value = false;
  router.push('/login');
};

watch(route, () => {
  checkAuth();
});

</script>

<template>
  <header class="bg-base-100 p-4 mb-1 shadow sticky top-0 z-50">
    <nav class="container mx-auto flex justify-between items-center">
      
      <RouterLink to="/" class="font-bold text-xl hover:text-primary transition-colors text-indigo-600">
        HobbyLobby
      </RouterLink>

      <div class="flex items-center gap-4">
        
        <RouterLink to="/createGroup" class="btn btn-sm btn-ghost gap-2 hidden sm:flex bg-green-400 hover:bg-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Group
        </RouterLink>

        <RouterLink v-if="!isLoggedIn" to="/login" class="btn btn-sm btn-primary text-white">
          Login
        </RouterLink>

        <div v-else class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
            <div class="w-10 rounded-full border border-gray-300">
              <img alt="Avatar" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" />
            </div>
          </div>
          <ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
            <li>
              <RouterLink :to="`/user/${myUserId}`" class="justify-between">
                Mio Profilo
              </RouterLink>
            </li>
            <li><a @click="logout" class="text-red-500">Logout</a></li>
          </ul>
        </div>

        <RouterLink to="/createPlace" class="btn btn-sm bg-green-400 hover:bg-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Place
        </RouterLink>

        <a class="btn btn-sm btn-ghost">Login</a>
      </div>

    </nav>
  </header>

  <RouterView :key="$route.fullPath" />
</template>
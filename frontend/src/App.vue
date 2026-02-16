<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="bg-base-200 p-4 mb-1 shadow sticky top-0 z-50">
    <nav class="container mx-auto flex justify-between items-center">
      
      <RouterLink to="/" class="font-bold text-xl hover:text-primary transition-colors">
        HobbyLobby
      </RouterLink>

      <div class="flex items-center gap-2">
        
        <RouterLink to="/createGroup" class="btn btn-sm bg-green-400 hover:bg-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Group
        </RouterLink>

        <a class="btn btn-sm btn-ghost">Login</a>
      </div>

    </nav>
  </header>

  <RouterView />
</template>
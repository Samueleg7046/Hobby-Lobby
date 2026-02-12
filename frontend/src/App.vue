<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <header class="bg-base-200 p-4 mb-1 shadow">
    <nav class="container mx-auto flex justify-between">
      <span class="font-bold text-xl">HobbyLobby</span>
      <div>
        <a class="btn btn-sm btn-ghost">Login</a>
      </div>
    </nav>
  </header>

  <RouterView />
</template>

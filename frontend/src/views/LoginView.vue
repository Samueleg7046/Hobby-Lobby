<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');

const googleLoginUrl = `${API_URL}/users/auth/google`;

const handleLogin = async () => {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginIdentifier: email.value, password: password.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login fallito');
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('userName', data.user.displayName);
    router.push(`/user/${data.user.id}`);
  } catch (err) {
    error.value = err.message;
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
      <h2 class="text-2xl font-bold text-center mb-6">Login to Hobby Lobby</h2>
      <div v-if="error" class="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
        {{ error }}
      </div>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email or Username</label>
          <input v-model="email" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-indigo-500 focus:ring-indigo-500">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input v-model="password" type="password" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:border-indigo-500 focus:ring-indigo-500">
        </div>
        <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition">
          Login
        </button>
      </form>
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-300"></div></div>
        <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-500">Or</span></div>
      </div>
      <a :href="googleLoginUrl" class="flex items-center justify-center w-full border border-gray-300 py-2 rounded-md hover:bg-gray-50 transition">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="h-5 w-5 mr-2" alt="Google">
        Login with Google
      </a>
      <p class="mt-4 text-center text-sm text-gray-600">
        Don't have an account? 
        <router-link to="/register" class="text-indigo-600 hover:underline">Register</router-link>
      </p>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';

const form = ref({
  uniqueName: '',
  displayName: '',
  email: '',
  password: '',
  birthDate: ''
});
const message = ref('');
const isError = ref(false);

const handleRegister = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Errore registrazione');
    message.value = 'Registrazione riuscita! Controlla la console del server per il link di verifica.';
    isError.value = false;
  } catch (err) {
    message.value = err.message;
    isError.value = true;
  }
};
</script>
<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
      <h2 class="text-2xl font-bold text-center mb-6">Create Account</h2>
      <div v-if="message" :class="`p-3 rounded mb-4 text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`">
        {{ message }}
      </div>
      <form @submit.prevent="handleRegister" class="space-y-4">
        <input v-model="form.displayName" placeholder="Display Name (e.g. Mario Rossi)" required class="w-full border p-2 rounded">
        <input v-model="form.uniqueName" placeholder="Username (es. supermario)" required class="w-full border p-2 rounded">
        <input v-model="form.email" type="email" placeholder="Email" required class="w-full border p-2 rounded">
        <input v-model="form.password" type="password" placeholder="Password" required class="w-full border p-2 rounded">
        <label class="block text-sm text-gray-600">Birth Date:</label>
        <input v-model="form.birthDate" type="date" required class="w-full border p-2 rounded">
        <button type="submit" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Register</button>
      </form>
      <p class="mt-4 text-center text-sm">
        Already have an account? <router-link to="/login" class="text-indigo-600">Login</router-link>
      </p>
    </div>
  </div>
</template>
<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  const token = route.query.token;
  const userId = route.query.userId;
  if (token && userId) {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    router.push(`/user/${userId}`);
  } else {
    router.push('/login');
  }
});
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <div class="text-xl font-semibold text-gray-600">
      Authenticating... 🔄
    </div>
  </div>
</template>
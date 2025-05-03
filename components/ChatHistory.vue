<template>
    <main class="flex-1 overflow-y-auto px-6 py-4 space-y-6">
      <div v-if="!sessionId" class="text-gray-500 italic">Please upload a document to start.</div>
      <div v-for="(entry, i) in history" :key="i" class="space-y-2">
        <div class="bg-gray-800 p-4 rounded border border-gray-700">
          <p class="text-blue-400 font-medium">You:</p>
          <p class="text-gray-200 whitespace-pre-wrap">{{ entry.query }}</p>
        </div>
        <div class="bg-gray-900 p-4 rounded border border-gray-700">
          <p class="text-green-400 font-medium">Assistant:</p>
          <p class="text-gray-200 whitespace-pre-wrap">{{ entry.answer }}</p>
        </div>
      </div>
    </main>
</template>

<script setup>
    const props = defineProps(['history', 'sessionId'])
</script>
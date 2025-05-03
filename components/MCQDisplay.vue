<template>
  <div v-for="(q, index) in questions" :key="index" class="bg-gray-700 p-4 rounded mb-4">
    <h4 class="text-lg font-semibold mb-2 text-gray-200">{{ index + 1 }}. {{ q.question }}</h4>
    <div class="space-y-2">
      <label v-for="(optText, optKey) in q.options" :key="optKey" class="flex gap-2">
        <input
          type="radio"
          :name="'q' + index"
          :value="optKey"
          v-model="q.selected"
          :disabled="q.selected"
          class="text-gray-300"
        />
        <span :class="{
          'text-green-400 font-bold': q.selected === q.correct && optKey === q.correct,
          'text-red-400 line-through': q.selected && q.selected !== q.correct && optKey === q.selected
        }">
          {{ optKey }}. {{ optText }}
        </span>
      </label>
    </div>
    <div v-if="q.selected" class="mt-2 text-sm text-gray-300">
      <strong>Explanation:</strong> {{ q.explanation }}
    </div>
  </div>
</template>

<script setup>
  const props = defineProps(['questions'])
</script>

<template>
    <div class="min-h-screen flex flex-col bg-gray-950 text-white">
      <header class="p-6 bg-gray-900 border-b border-gray-800 shadow">
        <h1 class="text-2xl font-bold text-blue-400">Study Assistant</h1>
        <p class="text-gray-400 text-sm">Upload a document, notes, book or similar and ask questions about the material or generate quizzes.</p>
      </header>
  
      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        <div v-for="(item, index) in history" :key="index">
          <div v-if="item.query" class="bg-gray-800 p-4 rounded mb-4">
            <p class="text-m text-blue-400 pb-2"><strong>Question:</strong></p>
            <p class="text-m text-gray-300">{{ item.query }}</p>
            <p class="mt-2 text-m text-blue-500"><strong>Answer:</strong></p>
            <div class="markdown-content" v-html="parseMarkdown(item.answer)"></div>
          </div>
  
          <MCQDisplay v-if="item.mcqs" :questions="item.mcqs" />
        </div>
      </div>
  
      <section class="p-6 bg-gray-900 border-t border-gray-800 sticky bottom-0 left-0 right-0 z-10">
        <form @submit.prevent="handleSubmit" class="flex gap-4">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
            @change="onFileSelected"
            class="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          <input
            v-model="query"
            type="text"
            placeholder="Ask a question regarding the document..."
            class="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
            :disabled="loading"
          />
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            :disabled="loading || (!file && !sessionId)"
          >{{ loading ? '...' : 'Send' }}</button>
          <button
            type="button"
            @click="generateMCQ"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
            :disabled="!sessionId"
          >MCQ</button>
        </form>
      </section>
    </div>
  </template>
  
  <script setup>
    import { ref, onMounted, watch } from 'vue'
    import axios from 'axios'
    import MCQDisplay from '@/components/MCQDisplay.vue'
    import { marked } from 'marked'  
  
    const file = ref(null)
    const query = ref('')
    const history = ref([])
    const loading = ref(false)
    const sessionId = ref(null)
  
    onMounted(() => {
      history.value = JSON.parse(localStorage.getItem('docChatHistory') || '[]')
      sessionId.value = localStorage.getItem('docChatSessionId')
    })
  
    watch(history, () => {
      localStorage.setItem('docChatHistory', JSON.stringify(history.value))
    })
  
    const onFileSelected = (e) => {
      file.value = e.target.files[0]
    }
  
    const handleSubmit = async () => {
      if (!query.value.trim()) return
      loading.value = true
      const formData = new FormData()
  
      if (file.value) {
        formData.append('document', file.value)
        formData.append('query', query.value)
        const res = await axios.post('/api/upload-and-query', formData)
        sessionId.value = res.data.sessionId
        localStorage.setItem('docChatSessionId', sessionId.value)
        history.value.push({ query: query.value, answer: res.data.answer })
        file.value = null
      } else if (sessionId.value) {
        const res = await axios.post('/api/query-document', { query: query.value, sessionId: sessionId.value })
        history.value.push({ query: query.value, answer: res.data.answer })
      }
  
      query.value = ''
      loading.value = false
    }
  
    const generateMCQ = async () => {
      if (!sessionId.value) return alert('Upload a document first.')
  
      loading.value = true
      try {
        const res = await axios.post('/api/generate-mcq', { sessionId: sessionId.value })
        console.log('MCQ Generation Response:', res.data)

        if (typeof res.data === 'string') {
          try {
            res.data = JSON.parse(res.data)
          } catch (error) {
            console.error("Error parsing MCQs:", error)
            alert('Error parsing MCQs.')
            return
          }
        }
  
        if (Array.isArray(res.data)) {
          history.value.push({ mcqs: res.data })
        } else {
          alert('Failed to generate MCQs. Please try again.')
        }
      } catch (error) {
        console.error('Error during MCQ generation:', error)
        alert('An error occurred while generating MCQs.')
      } finally {
        loading.value = false
      }
    }

    const parseMarkdown = (markdownText) => {
      return marked(markdownText || '', { breaks: true });
    }
</script>

<style>
.markdown-content {
  white-space: pre-wrap;
}

.markdown-content ul,
.markdown-content ol {
  padding-left: 10px;
}

.markdown-content strong {
  font-weight: bold;
}
</style>
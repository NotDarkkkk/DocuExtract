<template>
    <div class="min-h-screen flex flex-col bg-gray-950 text-white">
      <div
        v-if="showCover"
        @click="hideCover"
        class="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col items-center justify-center text-center p-8 transition-opacity duration-700"
        :class="{ 'opacity-0 pointer-events-none': !coverVisible }"
      >
        <h1 class="text-4xl font-bold text-blue-400 mb-4">📘 Study Assistant</h1>
        <p class="text-lg text-gray-300 max-w-2xl mb-6">
          Upload class notes, textbooks, or documents, then ask questions or generate quizzes using AI.
        </p>
        <div class="bg-gray-900 border border-gray-700 rounded-lg p-6 text-left max-w-xl w-full mb-6">
          <h2 class="text-xl font-semibold text-blue-300 mb-3">🔍 Features</h2>
          <ul class="list-disc list-inside text-gray-300 space-y-2">
            <li>📄 Upload files (PDF, DOCX, TXT, images)</li>
            <li>❓ Ask contextual questions about your material</li>
            <li>📝 Auto-generate multiple choice questions</li>
          </ul>
        </div>
        <p class="text-sm text-gray-500 italic">Click anywhere to begin</p>
      </div>
      <header class="p-6 bg-gray-900 border-b border-gray-800 shadow">
        <h1 class="text-2xl font-bold text-blue-400">Study Assistant</h1>
        <p class="text-gray-400 text-sm">Upload a document, notes, book or similar and ask questions about the material or generate quizzes.</p>
      </header>
      <div v-if="errorMessage" class="mb-4 p-3 rounded bg-red-800 text-red-200 border border-red-500">
        {{ errorMessage }}
      </div>
      <div class="flex-1 overflow-y-auto p-6 space-y-4">       
        <div v-for="(item, index) in history" :key="index">
          <div v-if="item.query" class="bg-gray-800 p-2 rounded mb-4">
            <p class="text-m text-blue-400 pb-2"><strong>Question:</strong></p>
            <p class="text-m text-gray-300">{{ item.query }}</p>
            <p class="mt-2 text-m text-blue-500"><strong>Answer:</strong></p>
            <div class="markdown-content" v-html="parseMarkdown(item.answer)"></div>
          </div>
  
          <MCQDisplay v-if="item.mcqs" :questions="item.mcqs" />
        </div>
        <div v-if="loading" class="text-blue-400 flex items-center gap-2">
          <span>Generating answer</span>
          <span class="flex space-x-1">
            <span class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
            <span class="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></span>
            <span class="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></span>
          </span>
        </div>
      </div>
  
      <section class="p-6 bg-gray-900 border-t border-gray-800 sticky bottom-0 left-0 right-0 z-10">
        <form @submit.prevent="handleSubmit" class="flex gap-4">
          <label
            @dragover.prevent
            @drop.prevent="handleDrop"
            @dragenter.prevent="handleDragEnter"
            @dragleave.prevent="handleDragLeave"
            for="file-upload"
            :class="[
              'flex items-center justify-center gap-2 px-4 py-2 rounded border border-dashed cursor-pointer transition text-sm',
              isDragging ? 'bg-blue-900 border-blue-400 text-blue-100' : 'bg-gray-800 border-blue-500 text-blue-300 hover:bg-gray-700'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h10a4 4 0 004-4m-5-4l-4-4m0 0l-4 4m4-4v12"></path>
            </svg>
            <span>{{ fileName || 'Click or drag a file here' }}</span>
            <input
              ref="fileInput"
              id="file-upload"
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
              @change="onFileSelected"
              class="hidden"
            />
          </label>
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

  const file = ref(null)
  const fileName = ref('')
  const fileInput = ref(null)
  const isDragging = ref(false)

  const query = ref('')
  const history = ref([])
  const loading = ref(false)
  const sessionId = ref(null)
  const errorMessage = ref('')
  
  const showCover = ref(true)
  const coverVisible = ref(true)

  const hideCover = () => {
    coverVisible.value = false
    setTimeout(() => {
      showCover.value = false
    }, 700)
  }

  onMounted(() => {
    history.value = JSON.parse(localStorage.getItem('docChatHistory') || '[]')
    sessionId.value = localStorage.getItem('docChatSessionId')
  })

  watch(history, () => {
    localStorage.setItem('docChatHistory', JSON.stringify(history.value))
  })

  const showError = (message) => {
    errorMessage.value = message
    setTimeout(() => {
      errorMessage.value = ''
    }, 10000)
  }

  const withTimeout = (promise, ms = 30000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms)
      ),
    ])
  }

  const onFileSelected = (e) => {
    file.value = e.target.files[0]
    fileName.value = file.value?.name || ''
  }

  const handleDrop = (e) => {
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      file.value = droppedFile
      fileName.value = droppedFile.name
      if (fileInput.value) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(droppedFile)
        fileInput.value.files = dataTransfer.files
      }
    }
    isDragging.value = false
  }

  const handleDragEnter = () => {
    isDragging.value = true
  }
  const handleDragLeave = () => {
    isDragging.value = false
  }

  const handleSubmit = async () => {
    if (!query.value.trim()) return
    loading.value = true
    const formData = new FormData()

    if (file.value) {
      formData.append('document', file.value)
      formData.append('query', query.value)

      try {
        const res = await withTimeout(axios.post('/api/upload-and-query', formData))
        sessionId.value = res.data.sessionId
        localStorage.setItem('docChatSessionId', sessionId.value)
        history.value.push({ query: query.value, answer: res.data.answer })
      } catch (err) {
        showError(err.message || 'Something went wrong while uploading and querying.')
      }

      file.value = null
      fileName.value = ''
      if (fileInput.value) fileInput.value.value = ''
    } else if (sessionId.value) {
      try {
        const res = await withTimeout(
          axios.post('/api/query-document', {
            query: query.value,
            sessionId: sessionId.value,
          })
        )
        history.value.push({ query: query.value, answer: res.data.answer })
      } catch (err) {
        showError(err.message || 'Something went wrong while querying the document.')
      }
    }

    query.value = ''
    loading.value = false
  }

  const generateMCQ = async () => {
    if (!sessionId.value) {
      showError('Upload a document first.')
      return
    }

    loading.value = true
    try {
      const res = await withTimeout(
        axios.post('/api/generate-mcq', { sessionId: sessionId.value })
      )

      if (typeof res.data === 'string') {
        try {
          res.data = JSON.parse(res.data)
        } catch (error) {
          console.error('Error parsing MCQs:', error)
          showError('Error parsing MCQs.')
          return
        }
      }

      if (Array.isArray(res.data)) {
        history.value.push({ mcqs: res.data })
      } else {
        showError('Failed to generate MCQs. Please try again.')
      }
    } catch (error) {
      console.error('MCQ generation failed:', error)
      showError(error.message || 'An error occurred while generating MCQs.')
    } finally {
      loading.value = false
    }
  }

  const parseMarkdown = (markdownText) => {
    if (!markdownText) return ''

    markdownText = markdownText.replace(/^###### (.*)/gm, '<h6>$1</h6>')
      .replace(/^##### (.*)/gm, '<h5>$1</h5>')
      .replace(/^#### (.*)/gm, '<h4>$1</h4>')
      .replace(/^### (.*)/gm, '<h3>$1</h3>')
      .replace(/^## (.*)/gm, '<h2>$1</h2>')
      .replace(/^# (.*)/gm, '<h1>$1</h1>')

    markdownText = markdownText.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>')

    markdownText = markdownText.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')

    markdownText = markdownText.replace(/^[\*\-] (.*)/gm, '<ul><li>$1</li></ul>')

    markdownText = markdownText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

    return markdownText
  }
</script>

<style>
.markdown-content {
  padding-bottom: 0px;
  white-space: pre-wrap;
}

.markdown-content li {
  padding: 0px;
}

.markdown-content ul,
.markdown-content ol {
  padding-bottom: 2px;
  padding-left: 10px;
}

.markdown-content strong {
  font-weight: bold;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content a {
  color: #1e40af;
  text-decoration: none;
}

.markdown-content li p {
  margin: 0;
  padding: 0;
}
</style>

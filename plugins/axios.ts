import axios from 'axios'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.provide('axios', axios)

  axios.defaults.baseURL = 'http://localhost:3000'
})

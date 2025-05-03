export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  plugins: ['~/plugins/axios'],
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  runtimeConfig: {
    googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    googleCloudLocation: process.env.GOOGLE_CLOUD_LOCATION || 'eu-central2',
  },

  nitro: {
    preset: 'node-server',
  }
})
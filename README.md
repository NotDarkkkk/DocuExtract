# Study assistant

This is a Nuxt.js application that uses Google Vertex AI's Gemini 2.0 flash model to process documents and answer user queries. It supports uploading a file, entering a query, and making quizzes based on the provided document.

## Features

- Answer questions about the uploaded document
- Make quizzes about the given material
- Point out where the material is from in the document

## Technologies Used

- [Google Vertex AI API](https://cloud.google.com/vertex-ai)
- `gemini-2.0-flash-001`

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set environment variables**:

   Create a `.env` file with:

   ```bash
   GOOGLE_CLOUD_PROJECT=your-google-project-id
   LOCATION=your-model-region
   GOOGLE_APPLICATION_CREDENTIALS=path-to-api-key.json
   ```

3. **Run the server**:

   ```bash
   npm run dev
   ```

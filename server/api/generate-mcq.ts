import { readBody } from 'h3'
import { VertexAI } from '@google-cloud/vertexai'
import { sessions } from './upload-and-query'

const projectId = process.env.GOOGLE_CLOUD_PROJECT
const location = process.env.LOCATION
const vertexAI = new VertexAI({ project: projectId, location })

const generativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const sessionId = body.sessionId as string

  if (!sessionId) {
    return { error: 'Missing session ID.' }
  }

  const session = sessions.get(sessionId)
  if (!session) {
    return { error: 'Invalid or expired session ID.' }
  }

  const filePart = {
    inlineData: {
      mimeType: session.mimeType,
      data: session.base64,
    },
  }

  const questionCount = body.count ?? 3
  const context = body.context?.trim()
  
  const prompt = 
  `
    Based only on the content of this document${context ? `, and focusing on: "${context}"` : ''}, generate ${questionCount} multiple choice questions.
    Each should have 4 options (A–D), a correct answer key, and a brief explanation with an exact quote or line from the document, along with the page number and context.
    Format the response as a JSON array, with each object containing:
    - "question"
    - "options" (object with A, B, C, D)
    - "correct" (A/B/C/D)
    - "explanation"
    Return only the JSON array, nothing else.
  `


  const result = await generativeModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [filePart, { text: prompt }],
      },
    ],
  })

  const raw = result.response?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!raw) {
    return {
      error: 'Model response is undefined or empty.',
      raw,
    }
  }

  // console.log('Model raw response:', raw)

  try {
    const cleanedRaw = raw
      .replace(/```json|```/g, '')
      .replace(/\n/g, '')
      .trim();

    const parsed = JSON.parse(cleanedRaw)
    
    if (!Array.isArray(parsed)) {
      return {
        error: 'Expected an array of MCQs, but got something else.',
        raw,
      }
    }

    return parsed
  } catch (e) {
    console.error('Error parsing model response:', e)
    return {
      error: 'Model response could not be parsed as JSON.',
      raw,
    }
  }
})
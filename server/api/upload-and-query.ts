import { readFormData } from 'h3'
import { VertexAI } from '@google-cloud/vertexai'

const projectId = process.env.GOOGLE_CLOUD_PROJECT
const location = process.env.LOCATION
const vertexAI = new VertexAI({ project: projectId, location })

const generativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
})

const sessions = new Map<string, { base64: string; mimeType: string }>()

function generateSessionId() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export default defineEventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('document') as File
  const query = form.get('query') as string

  if (!file || !query) {
    return { error: 'Missing file or query.' }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')

  const filePart = {
    inlineData: {
      mimeType: file.type,
      data: base64,
    },
  }

  const instructions = "You are helping and using data only from the documents and when necessary provide pages or locations"

  const result = await generativeModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: instructions }],
      },
      {
        role: 'user',
        parts: [
          filePart,
          { text: query },
        ],
      },
    ],
  })
  

  const answer =
    result.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated.'
  console.log(answer);
  const sessionId = generateSessionId()
  sessions.set(sessionId, { base64, mimeType: file.type })

  return { answer, sessionId }
})

export { sessions }
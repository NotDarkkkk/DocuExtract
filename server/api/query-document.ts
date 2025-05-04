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
  const query = body.query as string
  const sessionId = body.sessionId as string

  if (!query || !sessionId) {
    return { error: 'Missing query or session ID.' }
  }

  const session = sessions.get(sessionId) as { mimeType: string; base64: string } | undefined
  if (!session) {
    return { error: 'Invalid or expired session ID.' }
  }

  const filePart = {
    inlineData: {
      mimeType: session.mimeType,
      data: session?.base64 || '',
    },
  }

  const result = await generativeModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [filePart, { text: query }],
      },
    ],
  })

  const answer =
    result.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated.'

  return { answer }
})

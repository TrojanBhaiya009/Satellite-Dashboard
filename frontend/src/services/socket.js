import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
})

export const initializeSocket = (userId) => {
  socket.emit('join_room', userId)
}

export const subscribeToDataset = (datasetId) => {
  socket.emit('subscribe_dataset', datasetId)
}

export const subscribeToAnalysis = (analysisId) => {
  socket.emit('subscribe_analysis', analysisId)
}

export const onAnalysisProgress = (callback) => {
  socket.on('analysis_progress', callback)
}

export const onAnalysisCompleted = (callback) => {
  socket.on('analysis_completed', callback)
}

export const onAnalysisFailed = (callback) => {
  socket.on('analysis_failed', callback)
}

export default socket

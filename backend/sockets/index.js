export const initializeSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join_room', (userId) => {
      socket.join(`user_${userId}`);
      socket.emit('room_joined', { message: 'Connected to real-time updates' });
    });

    socket.on('subscribe_dataset', (datasetId) => {
      socket.join(`dataset_${datasetId}`);
      socket.emit('subscribed', { datasetId });
    });

    socket.on('subscribe_analysis', (analysisId) => {
      socket.join(`analysis_${analysisId}`);
      socket.emit('subscribed', { analysisId });
    });

    socket.on('disconnect', () => {
      console.log(`👋 Client disconnected: ${socket.id}`);
    });
  });
};

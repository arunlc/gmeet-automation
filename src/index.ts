import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connect as mongoConnect } from 'mongoose';
import path from 'path';
import sessionRoutes from './routes/sessionRoutes';
import { sessionScheduler } from './automation/scheduler';

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/sessions', sessionRoutes);

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gmeet-automation';
mongoConnect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        // Start the session scheduler after MongoDB connection is established
        sessionScheduler.start();
    })
    .catch((error) => console.error('MongoDB connection error:', error));

// Handle application shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down application...');
    sessionScheduler.stop();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Shutting down application...');
    sessionScheduler.stop();
    process.exit(0);
});

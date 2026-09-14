import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import userRouter from './routes/user.routes.js'
import folderRouter from './routes/folder.routes.js';
import topicRouter from './routes/topic.routes.js';
import chatRouter from './routes/chat.route.js';
import modelRouter from './routes/model.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization'],

    credentials: true,

    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());

app.get('/', (req, res) => {
    return res.json({ message: "healthy server check" });
})

app.use('/api/users', userRouter);
app.use('/api/folders', folderRouter);
app.use('/api/topics', topicRouter);
app.use('/api/chat', chatRouter);
app.use('/api/models', modelRouter);

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('🍃 mongo db connected');
    } catch {
        console.error("🥀couldn't connect to mongodb");
        process.exit(1);
    }
}

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`⚡caffeinated server running at http://localhost:${PORT}`);
        console.log('LM_STUDIO_URL:', process.env.LM_STUDIO_URL);
        console.log('MCP_SERVER_URL:', process.env.MCP_SERVER_URL);
    })
})
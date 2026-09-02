import express from 'express';
import { sendMessage, getChats, getChatMessages } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/chats', getChats);
router.get('/messages', getChatMessages)
router.post('/message', sendMessage);

export default router;
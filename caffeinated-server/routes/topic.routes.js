import express from 'express';
import {
    getTopics,
    getTopic,
    addTopic,
    deleteTopic,
    upsertTopicNotes
} from '../controllers/topic.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getTopics);
router.get('/:topicId', getTopic);
router.post('/', addTopic);
router.put('/:topicId/notes', upsertTopicNotes);
router.delete('/:topicId', deleteTopic);

export default router;
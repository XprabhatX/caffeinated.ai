import express from 'express';
import {
    fetchAvailableModels,
    fetchAllModels,
    syncModelsForProvider
} from '../controllers/model.controller.js';

import { authenticate } from '../middleware/auth.middleware.js';
import { syncAuth } from '../middleware/syncAuth.middleware.js';

const router = express.Router();

router.get(
    '/',
    authenticate,
    fetchAvailableModels
);

router.get(
    '/all',
    authenticate,
    fetchAllModels
);

router.post(
    '/sync',
    syncAuth,
    syncModelsForProvider
);


export default router;
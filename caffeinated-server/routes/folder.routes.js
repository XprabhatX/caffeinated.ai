import express from 'express';
import {
    getFolders,
    createFolder,
    updateFolderById,
    deleteFolderById
} from '../controllers/folder.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getFolders);
router.post('/', createFolder);
router.patch('/:folderId', updateFolderById);
router.delete('/:folderId', deleteFolderById);

export default router;
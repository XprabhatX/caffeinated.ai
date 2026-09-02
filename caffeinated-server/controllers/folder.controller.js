import {
    getAllFolders,
    addFolder,
    updateFolder,
    deleteFolder
} from '../services/folder.service.js';

export const getFolders = async (req, res, next) => {
    try {
        const { keyword = '' } = req.query;

        console.log('readched getFolders, userId: ' + req.user.id);

        const folders = await getAllFolders(
            req.user.id,
            keyword
        );

        res.status(200).json(folders);
    } catch (error) {
        next(error);
    }
};

export const createFolder = async (req, res, next) => {
    try {
        const folder = await addFolder({
            ...req.body,
            userId: req.user.id
        });

        res.status(201).json(folder);
    } catch (error) {
        next(error);
    }
};

export const updateFolderById = async (req, res, next) => {
    try {
        const { folderId } = req.params;

        const folder = await updateFolder(
            req.user.id,
            folderId,
            req.body
        );

        if (!folder) {
            return res.status(404).json({
                message: 'Folder not found'
            });
        }

        res.status(200).json(folder);
    } catch (error) {
        next(error);
    }
};

export const deleteFolderById = async (req, res, next) => {
    try {
        const { folderId } = req.params;

        const folder = await deleteFolder(
            req.user.id,
            folderId
        );

        if (!folder) {
            return res.status(404).json({
                message: 'Folder not found'
            });
        }

        res.status(200).json({
            message: 'Folder deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
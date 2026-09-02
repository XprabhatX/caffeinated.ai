import { Schema, model } from 'mongoose';

const folderSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ''
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

export const Folder = model('Folder', folderSchema);
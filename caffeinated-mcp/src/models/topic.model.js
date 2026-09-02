import { Schema, model } from 'mongoose';

const topicSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ''
        },

        folderId: {
            type: Schema.Types.ObjectId,
            ref: 'Folder',
            required: true,
            index: true
        },

        notes: {
            type: String,
            default: ''
        },

        context: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

export const Topic = model('Topic', topicSchema);
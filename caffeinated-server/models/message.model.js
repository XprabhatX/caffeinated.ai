import { Schema, model } from 'mongoose';

const messageSchema = new Schema(
    {
        chatId: {
            type: Schema.Types.ObjectId,
            ref: 'Chat',
            required: true
        },

        seq: {
            type: Number,
            required: true
        },

        thoughts: {
            type: String,
            default: null
        },

        text: {
            type: String,
            required: true
        },

        context: {
            type: Schema.Types.Mixed,
            default: null
        },

        sender: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },

        model: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'completed'
        },

        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

messageSchema.index(
    { chatId: 1, seq: 1 },
    { unique: true }
);

export const Message = model('Message', messageSchema);
import { Schema, model } from 'mongoose';

const chatSchema = new Schema(
  {
    folderId: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    context: {
      type: Schema.Types.Mixed,
      default: {}
    },

    lastMessage: {
      type: String,
      default: ''
    },

    lastMessageSeq: {
      type: Number,
      default: 0
    },

    lastTimestamp: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Chat = model('Chat', chatSchema);
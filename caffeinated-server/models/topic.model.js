import { Schema, model } from 'mongoose';

const topicSchema = new Schema(
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
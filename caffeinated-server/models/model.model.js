import { Schema, model } from 'mongoose';

const modelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    organization: {
      type: String,
      default: ''
    },

    provider: {
      type: String,
      required: true,
      trim: true
    },
  },
  {
    timestamps: true
  }
);

export const Model = model('Model', modelSchema);
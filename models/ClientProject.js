const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'blocked'],
      default: 'pending',
    },
    dueDate: { type: Date },
    completedAt: { type: Date },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const clientProjectSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectName: { type: String, required: true, trim: true },
    projectType: {
      type: String,
      enum: ['Website', 'Mobile App', 'Custom Software'],
      default: 'Website',
    },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'in-review', 'completed', 'on-hold'],
      default: 'not-started',
    },
    startDate: { type: Date },
    estimatedEndDate: { type: Date },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    milestones: [milestoneSchema],
    notes: [
      {
        text: { type: String },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClientProject', clientProjectSchema);

import mongoose from 'mongoose';

const electionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    clubName: { type: String, required: true, trim: true },
    electionDate: { type: Date, required: true },
    votingEnabled: { type: Boolean, default: false },
    published: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Election', electionSchema);

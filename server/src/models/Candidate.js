import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    name: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    photoUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Candidate', candidateSchema);

import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voter', required: true },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true }
  },
  { timestamps: true }
);

voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);

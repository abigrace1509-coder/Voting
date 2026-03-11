import mongoose from 'mongoose';

const voterSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    biometricHash: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model('Voter', voterSchema);

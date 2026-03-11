import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import Candidate from '../models/Candidate.js';
import Election from '../models/Election.js';
import TokenBlocklist from '../models/TokenBlocklist.js';
import Vote from '../models/Vote.js';
import Voter from '../models/Voter.js';
import { createToken, decodeToken } from '../utils/jwt.js';
import { hashBiometric } from '../utils/biometric.js';

export const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin || !(await bcrypt.compare(password || '', admin.passwordHash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = createToken({ id: admin._id.toString(), role: 'admin' });
  res.json({ token });
};

export const createElection = async (req, res) => {
  const election = await Election.create(req.body);
  res.status(201).json(election);
};

export const addCandidate = async (req, res) => {
  const { electionId } = req.body;
  const election = await Election.findById(electionId);
  if (!election) return res.status(404).json({ message: 'Election not found' });
  const candidate = await Candidate.create(req.body);
  res.status(201).json(candidate);
};

export const registerVoter = async (req, res) => {
  const { studentId, name, department, biometricRaw } = req.body;
  const biometricHash = hashBiometric(biometricRaw || '');
  const voter = await Voter.create({ studentId, name, department, biometricHash });
  res.status(201).json(voter);
};

export const toggleVoting = async (req, res) => {
  const election = await Election.findByIdAndUpdate(req.params.id, { votingEnabled: req.body.votingEnabled }, { new: true });
  if (!election) return res.status(404).json({ message: 'Election not found' });
  res.json(election);
};

export const publishResults = async (req, res) => {
  const election = await Election.findByIdAndUpdate(req.params.id, { published: true }, { new: true });
  if (!election) return res.status(404).json({ message: 'Election not found' });
  res.json(election);
};

export const getStats = async (_req, res) => {
  const [elections, voters, votes] = await Promise.all([
    Election.countDocuments(),
    Voter.countDocuments(),
    Vote.countDocuments()
  ]);
  res.json({ elections, voters, votes });
};

export const adminLogout = async (req, res) => {
  const payload = decodeToken(req.token);
  await TokenBlocklist.create({ token: req.token, expiresAt: new Date(payload.exp * 1000) });
  res.json({ message: 'Logged out' });
};

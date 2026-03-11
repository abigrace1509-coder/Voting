import Candidate from '../models/Candidate.js';
import Election from '../models/Election.js';
import TokenBlocklist from '../models/TokenBlocklist.js';
import Vote from '../models/Vote.js';
import Voter from '../models/Voter.js';
import { hashBiometric } from '../utils/biometric.js';
import { createToken, decodeToken } from '../utils/jwt.js';

export const voterLogin = async (req, res) => {
  const { studentId, biometricRaw } = req.body;
  const voter = await Voter.findOne({ studentId });
  if (!voter) return res.status(404).json({ message: 'Voter not found' });
  const isMatch = voter.biometricHash === hashBiometric(biometricRaw || '');
  if (!isMatch) return res.status(401).json({ message: 'Biometric mismatch' });
  const token = createToken({ id: voter._id.toString(), role: 'voter' });
  res.json({ token, voter: { name: voter.name, studentId: voter.studentId } });
};

export const activeElections = async (_req, res) => {
  const elections = await Election.find({ votingEnabled: true }).sort({ createdAt: -1 });
  res.json(elections);
};

export const electionCandidates = async (req, res) => {
  const candidates = await Candidate.find({ electionId: req.params.id });
  res.json(candidates);
};

export const castVote = async (req, res) => {
  const { electionId, candidateId } = req.body;
  const election = await Election.findById(electionId);
  if (!election || !election.votingEnabled) return res.status(400).json({ message: 'Voting unavailable' });

  const existing = await Vote.findOne({ voterId: req.user.id, electionId });
  if (existing) return res.status(409).json({ message: 'Duplicate vote blocked' });

  await Vote.create({ voterId: req.user.id, electionId, candidateId });
  res.status(201).json({ message: 'Vote cast successfully' });
};

export const viewResults = async (req, res) => {
  const election = await Election.findById(req.params.id);
  if (!election || !election.published) return res.status(403).json({ message: 'Results not published' });

  const summary = await Vote.aggregate([
    { $match: { electionId: election._id } },
    { $group: { _id: '$candidateId', votes: { $sum: 1 } } }
  ]);

  const candidates = await Candidate.find({ electionId: election._id });
  const result = candidates.map((c) => ({
    candidateId: c._id,
    name: c.name,
    position: c.position,
    votes: summary.find((x) => x._id.toString() === c._id.toString())?.votes || 0
  }));
  res.json({ election: election.name, result });
};

export const voterLogout = async (req, res) => {
  const payload = decodeToken(req.token);
  await TokenBlocklist.create({ token: req.token, expiresAt: new Date(payload.exp * 1000) });
  res.json({ message: 'Logged out' });
};

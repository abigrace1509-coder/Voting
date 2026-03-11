import { Router } from 'express';
import {
  activeElections,
  castVote,
  electionCandidates,
  viewResults,
  voterLogin,
  voterLogout
} from '../controllers/voterController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/login', voterLogin);
router.get('/active-elections', auth('voter'), activeElections);
router.get('/elections/:id/candidates', auth('voter'), electionCandidates);
router.post('/cast-vote', auth('voter'), castVote);
router.get('/results/:id', auth('voter'), viewResults);
router.post('/logout', auth('voter'), voterLogout);

export default router;

import { Router } from 'express';
import {
  addCandidate,
  adminLogin,
  adminLogout,
  createElection,
  getStats,
  publishResults,
  registerVoter,
  toggleVoting
} from '../controllers/adminController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/login', adminLogin);
router.post('/create-election', auth('admin'), createElection);
router.post('/add-candidate', auth('admin'), addCandidate);
router.post('/register-voter', auth('admin'), registerVoter);
router.patch('/elections/:id/toggle-voting', auth('admin'), toggleVoting);
router.patch('/elections/:id/publish-results', auth('admin'), publishResults);
router.get('/stats', auth('admin'), getStats);
router.post('/logout', auth('admin'), adminLogout);

export default router;

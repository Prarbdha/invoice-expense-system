import express from 'express';
import {
  updateProfile,
  changePassword,
  uploadLogo,
} from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../config/upload';

const router = express.Router();

router.use(authenticateToken);

router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.post('/logo', upload.single('logo'), uploadLogo);

export default router;
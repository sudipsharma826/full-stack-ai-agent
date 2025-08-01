import express from 'express';
import { getUsers, login, logout, signup, updateUser } from '../controllers/userController';
import { auth } from '../middleware/auth';


const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update', auth, updateUser);
router.get('/users', auth, getUsers);

export default router;

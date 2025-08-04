import express from 'express';
import { getUsers, getUserByEmail, login, logout, signup, updateUser } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';


const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update', auth, updateUser);
router.get('/users', auth, getUsers);
router.get('/user/:email', auth, getUserByEmail);

export default router;

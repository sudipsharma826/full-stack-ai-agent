import express from 'express';
import { createTicket, getAllTickets, getTicketById } from '../controllers/ticketController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
router.get("/",auth,getAllTickets);
router.get("/:ticketId",auth,getTicketById);
router.post("/",auth,createTicket);

export default router;
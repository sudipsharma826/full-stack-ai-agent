import express from 'express';
import { createTicket, getAllTickets, getTicketById, updateTicketStatus, deleteTicket } from '../controllers/ticketController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
router.get("/",auth,getAllTickets);
router.get("/:ticketId",auth,getTicketById);
router.post("/",auth,createTicket);
router.put("/:ticketId/status",auth,updateTicketStatus);
router.delete("/:ticketId",auth,deleteTicket);

export default router;
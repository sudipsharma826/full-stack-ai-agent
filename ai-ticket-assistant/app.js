import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './lib/db.js';
import userRoutes from './routes/userRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import { serve } from 'inngest/express';
import {userSignUp} from './inngest/function/onSignUp.js';
import {onTicketCreate} from './inngest/function/onTicketCreate.js';
import inngest from './inngest/client.js';
import 'dotenv/config';


const app = express();
console.log("App_URL:", process.env.APP_URL);
app.use(cors({
  origin: process.env.APP_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(cookieParser());
const PORT = process.env.PORT;

//Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send('AI Ticket Assistant API is running');
});

app.use('/api/user', userRoutes);
app.use('/api/ticket', ticketRoutes);

//Inngest routes
app.use("/inngest",
  serve({
    client: inngest,
    functions: [userSignUp, onTicketCreate],
  })
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

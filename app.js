import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './lib/db.js';
import userRoutes from './routes/userRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import { serve } from 'inngest/express';
import {userSignUp} from './inngest/function/onSignUp.js';
import {onTicketCreate} from './inngest/function/onTicketCreate.js';
import inngest from './inngest/client.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT;

//Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send('Running');
});


app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);

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

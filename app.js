import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './lib/db.js';
import userRoutes from './routes/userRoutes.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT;

//Connect to MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send('AI Ticket Assistant is runninfdfgdfgdfg properly now!');
});


app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

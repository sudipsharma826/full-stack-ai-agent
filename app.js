import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './lib/db.js';
import user from './models/user.js';
import ticket from './models/ticket.js'; // Add this import
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

//check  the model is working
app.get('/test-user', async (req, res) => {
  try{
  const userData= new user({
    name :"Sudip Sharma",
    email:"sudeepsharmgfhfghfghfghfgha826@gmail.com",
    password:"12345678",
    role:"user",
    skills: ["JavaScript", "Node.js","Docker"],

  });
  await userData.save();
  res.status(201).json({ message: 'User created successfully' });
} catch (error) {
  console.error("Error creating user:", error);
  res.status(500).json({ message: 'Error creating user' });
}
});


app.get('/test-ticket', async (req, res) => {
  try{
    const newTicket = new ticket({ // Add 'new' keyword and use ticket model
      title: "Sample Ticket",
      description: "This is a sample ticket description",
      status: "open",
      createdBy: "60c72b2f9b1d8c001c8e4f1a", // demo user ID
      assignedTo: null,
      priority: "high",
      deadline: "2023-12-31",
      helpfulNotes: "This is a helpful note for the ticket.",
      relatedskills: ["JavaScript", "Node.js", "Docker"]
    });
    await newTicket.save();
    res.status(201).json({ message: 'Ticket created successfully' });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: 'Error creating ticket' });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

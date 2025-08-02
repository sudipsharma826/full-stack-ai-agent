import inngest from "../inngest/client.js";
import ticket from "../models/ticket.js";

export const createTicket= async(req, res) => {
    try{
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }
        //create the ticket with default values
        const newTicket = await ticket.create({
            title,
            description,
            status: "open",
            createdBy: req.user._id, 
        });

        //Trigger the Inngest function to handle ticket creation
        await inngest.sendEvent({
            name: "ticket/create",
            data: {
                ticketId: newTicket._id,
                title: newTicket.title,
                description: newTicket.description,
                createdBy: newTicket.createdBy.toString(),
            },
        });
        return res.status(201).json({ message: "Ticket created successfully and AI processing started", ticketId: newTicket });

    }catch(e){
        console.error("Error creating ticket:", e.message);
        return res.status(500).json({ message: "Internal server error" });

    }
}

// function to get a single ticket by ID 
export const getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;
        if(req.user.role !== "user") { 
        const foundTicket = await ticket.findById(ticketId).populate("assignedTo",["_id", "email"]); 
        }
        else{
        const foundTicket = await ticket.findOne({ _id: ticketId, createdBy: req.user._id }).select("title description status createdBy assignedTo  priority deadline createdAt").populate("assignedTo",["_id", "email"]);
        }
        if (!foundTicket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        return res.status(200).json(foundTicket);
    } catch (e) {
        console.error("Error fetching ticket:", e.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}
// function to get all tickets
export const getAllTickets = async (req, res) => {
    try {
        if (req.user.role !== "user") { // beyond user role ,all can access
            const tickets = await ticket.find()
            .populate("assignedTo",["_id", "email"])// with assignedTo  user id and email is populated
            .sort({ createdAt: -1 }); // sort by createdAt in descending order
            return res.status(200).json(tickets);
        }else{
            //for user role, only return tickets created by the user
            const tickets = await ticket.find({ createdBy: req.user._id })
            .populate("assignedTo",["_id", "email"]) // with assignedTo  user id and email is populated
            .sort({ createdAt: -1 }); // sort by createdAt in descending order
            return res.status(200).json(tickets);
        }
    } catch (e) {
        console.error("Error fetching tickets:", e.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}
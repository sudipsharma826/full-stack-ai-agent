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
        try {
            const inngestResult = await inngest.send({
                name: "ticket/create",
                data: {
                    ticketId: newTicket._id.toString(),
                    title: newTicket.title,
                    description: newTicket.description,
                    createdBy: newTicket.createdBy.toString(),
                },
            });          
        } catch (inngestError) {
            return res.status(500).json({ message: "Failed to process ticket creation" });
        }
        return res.status(201).json({
            message: "Ticket created successfully and AI processing started",
            ticketId: newTicket._id
        });

    }catch(e){
        console.error("Error creating ticket:", e.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// function to get a single ticket by ID with role-based access
export const getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;
        let foundTicket;
        
        if (req.user.role === "admin") {
            // Admins can view all tickets
            foundTicket = await ticket.findById(ticketId).populate("assignedTo", ["_id", "email"]);
        } else if (req.user.role === "moderator") {
            // Moderators can view tickets assigned to them or created by them
            foundTicket = await ticket.findOne({ 
                _id: ticketId, 
                $or: [
                    { assignedTo: req.user._id },
                    { createdBy: req.user._id }
                ]
            }).populate("assignedTo", ["_id", "email"]);
        } else {
            // Users can only view tickets they created (exclude AI analysis fields)
            foundTicket = await ticket.findOne({ 
                _id: ticketId, 
                createdBy: req.user._id 
            }).select("title description status createdBy assignedTo priority deadline createdAt relatedSkills")
             .populate("assignedTo", ["_id", "email"]);
        }
        
        if (!foundTicket) {
            return res.status(404).json({ message: "Ticket not found or access denied" });
        }
        return res.status(200).json(foundTicket);
    } catch (e) {
        console.error("Error fetching ticket:", e.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}
// function to get all tickets with role-based access
export const getAllTickets = async (req, res) => {
    try {
        let tickets;
        
        if (req.user.role === "admin") {
            // Admins can view all tickets
            tickets = await ticket.find()
                .populate("assignedTo", ["_id", "email"])
                .populate("createdBy", ["_id", "email"])
                .sort({ createdAt: -1 });
        } else if (req.user.role === "moderator") {
            // Moderators can view tickets assigned to them or created by them
            tickets = await ticket.find({
                $or: [
                    { assignedTo: req.user._id },
                    { createdBy: req.user._id }
                ]
            })
                .populate("assignedTo", ["_id", "email"])
                .populate("createdBy", ["_id", "email"])
                .sort({ createdAt: -1 });
        } else {
            // Users can only view tickets they created (exclude AI analysis fields)
            tickets = await ticket.find({ createdBy: req.user._id })
                .select("title description status createdBy assignedTo priority deadline createdAt relatedSkills")
                .populate("assignedTo", ["_id", "email"])
                .populate("createdBy", ["_id", "email"])
                .sort({ createdAt: -1 });
        }
        
        return res.status(200).json(tickets);
    } catch (e) {
        console.error("Error fetching tickets:", e.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to update ticket status (close ticket)
export const updateTicketStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body;
        
        // Validate status
        if (!['open', 'in-progress', 'closed'].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be 'open', 'in-progress', or 'closed'" });
        }
        
        let foundTicket;
        
        if (req.user.role === "admin") {
            // Admins can update any ticket
            foundTicket = await ticket.findById(ticketId);
        } else if (req.user.role === "moderator") {
            // Moderators can only update tickets assigned to them
            foundTicket = await ticket.findOne({ 
                _id: ticketId, 
                assignedTo: req.user._id 
            });
        } else {
            return res.status(403).json({ message: "Access denied. Only moderators and admins can update ticket status." });
        }
        
        if (!foundTicket) {
            return res.status(404).json({ message: "Ticket not found or access denied" });
        }
        
        await ticket.findByIdAndUpdate(ticketId, { status });
        
        return res.status(200).json({ message: "Ticket status updated successfully" });
    } catch (e) {
        console.error("Error updating ticket status:", e.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to delete ticket
export const deleteTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        
        let foundTicket;
        
        if (req.user.role === "admin") {
            // Admins can delete any ticket
            foundTicket = await ticket.findById(ticketId);
        } else if (req.user.role === "moderator") {
            // Moderators can delete tickets they created or assigned to them
            foundTicket = await ticket.findOne({ 
                _id: ticketId, 
                $or: [
                    { assignedTo: req.user._id },
                    { createdBy: req.user._id }
                ]
            });
        } else {
            // Users can only delete tickets they created
            foundTicket = await ticket.findOne({ 
                _id: ticketId, 
                createdBy: req.user._id 
            });
        }
        
        if (!foundTicket) {
            return res.status(404).json({ message: "Ticket not found or access denied" });
        }
        
        await ticket.findByIdAndDelete(ticketId);
        
        return res.status(200).json({ message: "Ticket deleted successfully" });
    } catch (e) {
        console.error("Error deleting ticket:", e.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}
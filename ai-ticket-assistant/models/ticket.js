import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    title:String,
    description: String,
    status: {
        type: String,
        enum: ['open', 'in-progress', 'closed'],
        default: 'open'
    },
    createdBy:{type:mongoose.Schema.Types.ObjectId, ref: 'user'},
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'user' ,default: null},
    //below fields are added by AI
    summary: { type: String, default: null },
    priority: { type: String, default: null },
    deadline: { type: String, default: null },
    helpfulNotes: { type: String, default: null },
    relatedskills: { type: [String], default: [] },

}, { timestamps: true });

export default mongoose.model("ticket", ticketSchema);
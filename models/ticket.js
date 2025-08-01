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
    priority: String,
    deadline:String,
    helpfulNotes: String,
    relatedskills: [String],

}, { timestamps: true });

export default mongoose.model("ticket", ticketSchema);
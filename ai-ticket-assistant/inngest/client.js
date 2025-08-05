import { Inngest } from 'inngest';

const inngest = new Inngest({
    id: 'ai_ticket_assistant',
    name: "AI Ticket Assistant",
    // Add production configuration
    ...(process.env.NODE_ENV === 'production' && {
        eventKey: process.env.INNGEST_EVENT_KEY,
        signingKey: process.env.INNGEST_SIGNING_KEY,
    })
});

export default inngest;

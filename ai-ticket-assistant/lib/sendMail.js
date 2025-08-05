// import nodemailer from 'nodemailer';

// export async function sendMail(to, subject, text, html) {
//     try{
//     const transporter = nodemailer.createTransport({
//         host: process.env.MAILTRAP_SMTP_HOST,
//         port: process.env.MAILTRAP_SMTP_PORT,
//         secure: true, //always use secure connection
//         auth: {
//             user: process.env.MAILTRAP_SMTP_USER,
//             pass: process.env.MAILTRAP_SMTP_PASS
//         }
//     });
//     await transporter.sendMail({
//         from: `"AI Ticket Assistant" <${process.env.MAILTRAP_SMTP_USER}>`,
//         to,
//         subject,
//         text,
//         html
//     });
//     console.log('Email sent successfully');
//    } catch (error) {
//     console.error('Error sending email:', error.message);
//     throw error;
// }
// }
//we have test the mail are sent successfully using mailtrap.io
//now for the real production we will use the resend mail service


import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail(to, subject, text, html) {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY environment variable is not set');
    }


    try {
        // Use the default Resend domain for testing
        const fromEmail = 'AI Ticket Assistant <no-reply@sudipsharma.com.np>';
        
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to,
            subject,
            text,
            html,
        });

        if (error) {
            console.error('❌ Resend API Error:', error);
            throw new Error(`Resend API Error: ${JSON.stringify(error)}`);
        }

        console.log('✅ Email sent successfully!');
        console.log('📋 Email ID:', data?.id);
        return data;
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        console.error('📋 Full error:', error);
        throw error;
    }
}

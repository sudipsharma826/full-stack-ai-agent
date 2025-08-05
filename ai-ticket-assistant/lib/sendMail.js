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
    try {
        await resend.emails.send({
            from: process.env.MAILTRAP_SMTP_USER,
            to,
            subject,
            text,
            html
        });
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw error;
    }
}
import nodemailer from 'nodemailer';

export async function sendMail(to, subject, text, html) {
    try{
    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        secure: true, //always use secure connection
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    });
    await transporter.sendMail({
        from: `"AI Ticket Assistant" <${process.env.MAILTRAP_SMTP_USER}>`,
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
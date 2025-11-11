import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_FROM}>`,
    to: options.to || options.email, // Ưu tiên 'to', fallback 'email' cho tương thích
    subject: options.subject,
    text: options.message,
    html: options.html,
    attachments: options.attachments,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

const sendNewUserCredentials = async (to, name, password) => {
  const subject = 'Welcome to OCBS - Your Account Has Been Created!';
  const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #D32F2F; text-align: center;">Welcome to OCBS, ${name}!</h2>
                <p>An administrator has created an account for you on our cinema booking system.</p>
                <p>You can now log in using the following credentials:</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: left; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
                    <p style="margin: 5px 0;"><strong>Temporary Password:</strong> 
                        <span style="background-color: #e0e0e0; padding: 3px 8px; border-radius: 4px; font-family: 'Courier New', Courier, monospace;">${password}</span>
                    </p>
                </div>
                <p>We strongly recommend that you change your password after your first login for security reasons.</p>
                <p>Thank you for being a part of our system!</p>
                <p><strong>The OCBS Team</strong></p>
            </div>
        </div>
    `;

  await sendEmail({ to, subject, html });
};


export { sendEmail, sendNewUserCredentials };
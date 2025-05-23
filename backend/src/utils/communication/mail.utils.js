import nodemailer from "nodemailer";
import dotenv from "dotenv";
import winston from "winston";

dotenv.config();

// Configure Winston Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({
      filename: "logs/email-error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/email-combined.log",
    }),
  ],
});

// Email Configuration Options
const emailConfig = {
  host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
  port: parseInt(process.env.MAILTRAP_PORT) || 587,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
};

// Create Transporter Function with Robust Error Handling
const createTransporter = () => {
  try {
    return nodemailer.createTransport(emailConfig);
  } catch (error) {
    logger.error("Failed to create email transporter", { error });
    throw new Error("Email transporter configuration failed");
  }
};

// Verify SMTP Connection
export const verifyConnection = async () => {
  try {
    // Create transporter first
    const transporter = createTransporter();

    // Return a promise that resolves when connection is verified
    return new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          logger.error("SMTP Connection Verification Failed", {
            code: error.code,
            message: error.message,
            response: error.response,
          });
          reject(error);
        } else {
          logger.info("SMTP Connection Verified Successfully");
          resolve(transporter);
        }
      });
    });
  } catch (error) {
    logger.error("SMTP Connection Verification Error", { error });
    throw error;
  }
};

// Flexible Email Sending Function
export const sendEmail = async (options) => {
  const {
    to,
    subject,
    text,
    html,
    from = '"ProductBazar" <noreply@productbazar.com>',
  } = options;

  try {
    // Create and verify transporter
    const transporter = createTransporter();
    await verifyConnection(transporter);

    // Prepare email options
    const mailOptions = {
      from,
      to,
      subject,
      text,
      html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    logger.info("Email Sent Successfully", {
      messageId: info.messageId,
      recipient: to,
    });

    return info;
  } catch (error) {
    logger.error("Email Sending Failed", {
      recipient: to,
      subject,
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Specific Email Templates
export const sendVerificationEmail = async (email, subject, message) => {
  try {
    if (!email) {
      logger.error("Cannot send verification email: No email address provided");
      return { success: false, error: "No email address provided" };
    }

    logger.info(`Sending verification email to: ${email}`);

    // Create HTML content with the verification link
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #6C63FF; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Product Bazar</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #444;">${subject}</h2>
          <p style="font-size: 16px; line-height: 1.5;">${message}</p>
          <div style="text-align: center; margin-top: 30px;">
            <p>Thank you for joining Product Bazar!</p>
          </div>
        </div>
      </div>
    `;

    // Use the generic sendEmail function to handle the email sending
    const result = await sendEmail({
      to: email,
      subject: subject,
      html: htmlContent,
      from: `"${process.env.EMAIL_FROM_NAME || "Product Bazar"}" <${
        process.env.EMAIL_FROM || "noreply@productbazar.com"
      }>`,
    });

    logger.info(`Verification email sent successfully to: ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send verification email: ${error.message}`, {
      stack: error.stack,
    });
    // Don't throw the error, just return failure status
    return { success: false, error: error.message };
  }
};

// Password Reset Email
export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <a href="${resetLink}"
         style="background-color: #007bff;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                display: inline-block;">
        Reset Password
      </a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "ProductBazar Password Reset",
    html: htmlTemplate,
  });
};

/**
 * Masks an email address for display, showing only the first 3 characters
 */
export const maskEmail = (email) => {
  if (!email) return "";
  const [username, domain] = email.split("@");
  const maskedUsername = username.slice(0, 3) + "...";
  return `${maskedUsername}@${domain}`;
};

// Send collaborator invitation email
export const sendCollaboratorInvitationEmail = async (recipientEmail, projectTitle, projectSlug, inviterName, recipientName, role) => {
  try {
    if (!recipientEmail) {
      logger.error("Cannot send collaborator invitation: No email address provided");
      return { success: false, error: "No email address provided" };
    }

    logger.info(`Sending collaborator invitation email to: ${recipientEmail}`);

    // Create HTML content with the project link
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #6C63FF; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Product Bazar</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #444;">You've been added as a collaborator!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Hello ${recipientName || 'there'},</p>
          <p style="font-size: 16px; line-height: 1.5;">${inviterName || 'A user'} has added you as a collaborator on the project "${projectTitle}".</p>
          <p style="font-size: 16px; line-height: 1.5;">Your role: <strong>${role || 'contributor'}</strong></p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="${process.env.CLIENT_URL}/projects/${projectSlug}" style="background-color: #6C63FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Project</a>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p>Thank you for collaborating on Product Bazar!</p>
          </div>
        </div>
      </div>
    `;

    // Use the generic sendEmail function to handle the email sending
    const result = await sendEmail({
      to: recipientEmail,
      subject: `You've been added as a collaborator on "${projectTitle}"`,
      html: htmlContent,
      from: `"${process.env.EMAIL_FROM_NAME || "Product Bazar"}" <${process.env.EMAIL_FROM || "noreply@productbazar.com"}>`
    });

    logger.info(`Collaborator invitation email sent successfully to: ${recipientEmail}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send collaborator invitation email: ${error.message}`, {
      stack: error.stack
    });
    // Don't throw the error, just return failure status
    return { success: false, error: error.message };
  }
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendCollaboratorInvitationEmail,
  verifyConnection,
  maskEmail,
};

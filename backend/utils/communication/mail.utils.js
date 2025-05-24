// utils/mail.utils.js

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

// SVG Icons for professional email templates
const getSVGIcon = (iconName, size = 24, color = "#ffffff") => {
  const icons = {
    sparkles: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
    
    shield: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-8 7.5s-8-2.5-8-7.5c0-1.3.3-2.6.7-3.8L12 3l7.3 6.2c.4 1.2.7 2.5.7 3.8Z"/><path d="m9 12 2 2 4-4"/></svg>`,
    
    lock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="m7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    
    key: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`,
    
    unlock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="m7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
    
    handshake: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>`,
    
    gift: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.9 4.9 0 0 1 12 8a4.9 4.9 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>`,
    
    rocket: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
    
    trending: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>`,
    
    star: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/></svg>`,
    
    target: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    
    lightbulb: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
    
    alert: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/></svg>`,
    
    help: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    
    chart: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
    
    users: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    
    mail: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/></svg>`,
    
    external: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
    
    github: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`,
    
    linkedin: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
    
    twitter: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>`
  };
  
  return icons[iconName] || icons.lightbulb;
};

// Enhanced Email Template Base with Modern Design
const createEmailTemplate = (content, options = {}) => {
  const {
    title = "Product Bazar",
    preheader = "",
    backgroundColor = "#ffffff",
    primaryColor = "#8A2BE2",
    accentColor = "#DDA0DD",
    textColor = "#1A202C",
    subtleColor = "#718096",
  } = options;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${title}</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');
        
        :root {
          --primary: #8A2BE2;
          --primary-light: #A855F7;
          --primary-dark: #7C3AED;
          --accent: #DDA0DD;
          --accent-light: #F3E8FF;
          --accent-ultra-light: #FAF5FF;
          --success: #10B981;
          --warning: #F59E0B;
          --error: #EF4444;
          --gray-50: #F9FAFB;
          --gray-100: #F3F4F6;
          --gray-200: #E5E7EB;
          --gray-300: #D1D5DB;
          --gray-400: #9CA3AF;
          --gray-500: #6B7280;
          --gray-600: #4B5563;
          --gray-700: #374151;
          --gray-800: #1F2937;
          --gray-900: #111827;
        }
        
        * { 
          box-sizing: border-box; 
          margin: 0;
          padding: 0;
        }
        
        body, table, td, p, a, li, blockquote { 
          -webkit-text-size-adjust: 100%; 
          -ms-text-size-adjust: 100%; 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-feature-settings: 'cv11', 'ss01';
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        table, td { 
          mso-table-lspace: 0pt; 
          mso-table-rspace: 0pt; 
        }
        
        img { 
          -ms-interpolation-mode: bicubic; 
          border: 0; 
          outline: none; 
          text-decoration: none; 
          display: block;
          max-width: 100%;
          height: auto;
        }
        
        .email-container {
          max-width: 640px;
          margin: 0 auto;
          background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.65;
          color: ${textColor};
          overflow: hidden;
          border-radius: 24px;
          box-shadow: 
            0 32px 64px rgba(139, 92, 246, 0.07),
            0 8px 32px rgba(139, 92, 246, 0.04),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
        }
        
        .header {
          background: linear-gradient(135deg, 
            ${primaryColor} 0%, 
            #9333EA 25%, 
            #A855F7 50%, 
            #B794F6 75%, 
            #DDA0DD 100%);
          padding: 56px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
          z-index: 1;
        }
        
        .header::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: 
            conic-gradient(from 0deg at 50% 50%, 
              rgba(255, 255, 255, 0.1) 0deg, 
              rgba(255, 255, 255, 0.03) 60deg, 
              rgba(255, 255, 255, 0.1) 120deg, 
              rgba(255, 255, 255, 0.03) 180deg,
              rgba(255, 255, 255, 0.1) 240deg,
              rgba(255, 255, 255, 0.03) 300deg,
              rgba(255, 255, 255, 0.1) 360deg);
          animation: rotate 20s linear infinite;
          z-index: 1;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .logo {
          color: #ffffff;
          font-size: 36px;
          font-weight: 900;
          margin: 0;
          letter-spacing: -1.5px;
          position: relative;
          z-index: 2;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .content {
          padding: 56px 40px;
          background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
          position: relative;
        }
        
        .content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(139, 92, 246, 0.2) 25%, 
            rgba(139, 92, 246, 0.4) 50%, 
            rgba(139, 92, 246, 0.2) 75%, 
            transparent 100%);
        }
        
        .footer {
          background: linear-gradient(135deg, 
            #FAFBFC 0%, 
            #F4F6F8 50%, 
            #F0F2F5 100%);
          padding: 40px;
          text-align: center;
          border-radius: 0 0 24px 24px;
          border-top: 1px solid rgba(139, 92, 246, 0.08);
          position: relative;
        }
        
        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            ${primaryColor} 20%, 
            ${accentColor} 50%, 
            ${primaryColor} 80%, 
            transparent 100%);
          border-radius: 1px;
        }
        
        .btn {
          display: inline-block;
          padding: 18px 36px;
          background: linear-gradient(135deg, 
            ${primaryColor} 0%, 
            #9333EA 25%, 
            #A855F7 50%, 
            #B794F6 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 16px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: none;
          box-shadow: 
            0 12px 32px rgba(139, 92, 246, 0.25),
            0 4px 16px rgba(139, 92, 246, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          line-height: 1.2;
          letter-spacing: -0.25px;
          backdrop-filter: blur(20px);
        }
        
        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.3) 40%, 
            rgba(255, 255, 255, 0.4) 50%, 
            rgba(255, 255, 255, 0.3) 60%, 
            transparent 100%);
          transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 2px;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.4) 0%, 
            rgba(255, 255, 255, 0.1) 50%, 
            rgba(255, 255, 255, 0.4) 100%);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
        }
        
        .btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 
            0 20px 48px rgba(139, 92, 246, 0.35),
            0 8px 24px rgba(139, 92, 246, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        
        .btn:hover::before {
          left: 100%;
        }
        
        .btn:active {
          transform: translateY(-1px) scale(1.01);
          transition: all 0.1s ease;
        }
        
        .btn-secondary {
          background: linear-gradient(135deg, 
            rgba(139, 92, 246, 0.08) 0%, 
            rgba(139, 92, 246, 0.04) 100%);
          color: ${primaryColor} !important;
          border: 2px solid rgba(139, 92, 246, 0.2);
          box-shadow: 
            0 8px 24px rgba(139, 92, 246, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
        }
        
        .btn-secondary::after {
          background: linear-gradient(135deg, 
            rgba(139, 92, 246, 0.3) 0%, 
            rgba(139, 92, 246, 0.1) 50%, 
            rgba(139, 92, 246, 0.3) 100%);
        }
        
        .btn-secondary:hover {
          background: linear-gradient(135deg, 
            ${primaryColor} 0%, 
            #9333EA 25%, 
            #A855F7 100%);
          color: #ffffff !important;
          border-color: transparent;
          box-shadow: 
            0 16px 40px rgba(139, 92, 246, 0.3),
            0 6px 20px rgba(139, 92, 246, 0.2);
        }
        
        .card {
          background: linear-gradient(135deg, 
            #ffffff 0%, 
            #fefefe 50%, 
            #fdfdfd 100%);
          border: 1px solid rgba(139, 92, 246, 0.08);
          border-radius: 20px;
          padding: 40px;
          margin: 32px 0;
          box-shadow: 
            0 8px 32px rgba(139, 92, 246, 0.06),
            0 2px 16px rgba(139, 92, 246, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }
        
        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, 
            ${primaryColor} 0%, 
            #9333EA 25%, 
            #A855F7 50%, 
            #B794F6 75%, 
            ${accentColor} 100%);
          border-radius: 20px 20px 0 0;
        }
        
        .card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, rgba(221, 160, 221, 0.03) 0%, transparent 50%);
          border-radius: 20px;
          pointer-events: none;
        }
        
        .icon-circle {
          width: 88px;
          height: 88px;
          background: linear-gradient(135deg, 
            ${primaryColor} 0%, 
            #9333EA 25%, 
            #A855F7 50%, 
            #B794F6 100%);
          border-radius: 24px;
          margin: 0 auto 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 
            0 12px 32px rgba(139, 92, 246, 0.25),
            0 4px 16px rgba(139, 92, 246, 0.15),
            inset 0 2px 0 rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
        }
        
        .icon-circle::before {
          content: '';
          position: absolute;
          inset: 3px;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.15) 0%, 
            rgba(255, 255, 255, 0.05) 50%, 
            transparent 100%);
          border-radius: 21px;
        }
        
        .icon-circle::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          padding: 2px;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.4) 0%, 
            rgba(255, 255, 255, 0.1) 50%, 
            rgba(255, 255, 255, 0.4) 100%);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
        }
        
        .divider {
          height: 2px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(139, 92, 246, 0.2) 10%, 
            rgba(139, 92, 246, 0.4) 30%, 
            ${accentColor} 50%, 
            rgba(139, 92, 246, 0.4) 70%, 
            rgba(139, 92, 246, 0.2) 90%, 
            transparent 100%);
          margin: 48px 0;
          position: relative;
          border-radius: 1px;
        }
        
        .divider::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%);
          border-radius: 50%;
          box-shadow: 
            0 0 0 4px rgba(255, 255, 255, 1),
            0 4px 12px rgba(139, 92, 246, 0.3);
        }
        
        .social-links {
          margin: 32px 0 0 0;
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        
        .social-link {
          display: inline-flex;
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, 
            rgba(139, 92, 246, 0.08) 0%, 
            rgba(221, 160, 221, 0.08) 100%);
          border: 1px solid rgba(139, 92, 246, 0.1);
          border-radius: 16px;
          align-items: center;
          justify-content: center;
          color: var(--gray-600);
          text-decoration: none;
          font-size: 18px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 
            0 4px 16px rgba(139, 92, 246, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
        
        .social-link::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, 
            ${primaryColor} 0%, 
            #9333EA 25%, 
            #A855F7 100%);
          border-radius: 16px;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        
        .social-link:hover {
          transform: translateY(-4px) scale(1.08);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 
            0 12px 32px rgba(139, 92, 246, 0.3),
            0 4px 16px rgba(139, 92, 246, 0.2);
        }
        
        .social-link:hover::before {
          opacity: 1;
        }
        
        .social-link:hover span {
          position: relative;
          z-index: 2;
        }
        
        .highlight-box {
          background: linear-gradient(135deg, 
            var(--accent-ultra-light) 0%, 
            var(--accent-light) 50%, 
            #F8FAFC 100%);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 16px;
          padding: 28px;
          margin: 28px 0;
          position: relative;
          backdrop-filter: blur(10px);
          box-shadow: 
            0 4px 24px rgba(139, 92, 246, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }
        
        .highlight-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            ${primaryColor} 0%, 
            #A855F7 50%, 
            ${accentColor} 100%);
          border-radius: 16px 16px 0 0;
        }
        
        .highlight-box::after {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.05) 0%, transparent 60%);
          border-radius: 16px;
          pointer-events: none;
        }
          padding: 20px;
          margin: 20px 0;
          position: relative;
        }
        
        .highlight-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, ${primaryColor}, ${accentColor});
          border-radius: 12px 12px 0 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 20px;
          margin: 32px 0;
        }
        
        .stat-item {
          text-align: center;
          background: linear-gradient(135deg, 
            var(--gray-50) 0%, 
            #ffffff 50%, 
            var(--gray-50) 100%);
          padding: 28px 20px;
          border-radius: 16px;
          border: 1px solid rgba(139, 92, 246, 0.08);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          box-shadow: 
            0 4px 20px rgba(139, 92, 246, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }
        
        .stat-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, 
            ${primaryColor} 0%, 
            #A855F7 50%, 
            ${accentColor} 100%);
          border-radius: 16px 16px 0 0;
        }
        
        .stat-item::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(139, 92, 246, 0.1) 50%, 
            transparent 100%);
        }
        
        .stat-number {
          font-size: 32px;
          font-weight: 900;
          background: linear-gradient(135deg, 
            ${primaryColor} 0%, 
            #9333EA 50%, 
            #A855F7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          display: block;
          letter-spacing: -1px;
        }
        
        .stat-label {
          font-size: 12px;
          color: var(--gray-500);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          line-height: 1.2;
        }
        
        h1, h2, h3, h4 {
          margin: 0;
          line-height: 1.25;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        h1 {
          font-size: 40px;
          font-weight: 900;
          background: linear-gradient(135deg, 
            ${textColor} 0%, 
            var(--gray-700) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 20px;
          letter-spacing: -1.5px;
        }
        
        h2 {
          font-size: 28px;
          color: ${textColor};
          margin-bottom: 20px;
          font-weight: 800;
          letter-spacing: -1px;
        }
        
        h3 {
          font-size: 22px;
          color: ${textColor};
          margin-bottom: 16px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        h4 {
          font-size: 18px;
          color: ${textColor};
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        p {
          margin: 0 0 20px 0;
          line-height: 1.7;
          font-weight: 400;
          letter-spacing: -0.1px;
        }
        
        ul {
          margin: 0;
          padding-left: 24px;
        }
        
        li {
          margin: 12px 0;
          line-height: 1.7;
          font-weight: 400;
          letter-spacing: -0.1px;
        }
        
        a {
          color: ${primaryColor};
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        a:hover {
          color: #9333EA;
          text-decoration: underline;
          text-decoration-style: wavy;
          text-underline-offset: 4px;
        }
        
        strong {
          font-weight: 700;
          color: ${textColor};
        }
        
        @media only screen and (max-width: 640px) {
          .email-container { 
            width: 100% !important; 
            margin: 12px !important; 
            border-radius: 20px !important;
          }
          .content { 
            padding: 40px 28px !important; 
          }
          .header { 
            padding: 40px 28px !important; 
          }
          .footer { 
            padding: 32px 28px !important; 
          }
          .card {
            padding: 32px 24px !important;
            margin: 24px 0 !important;
            border-radius: 16px !important;
          }
          .btn { 
            padding: 16px 32px !important; 
            font-size: 15px !important; 
            width: 100% !important;
            max-width: 320px !important;
            border-radius: 14px !important;
          }
          .icon-circle {
            width: 72px !important;
            height: 72px !important;
            border-radius: 20px !important;
          }
          .logo {
            font-size: 32px !important;
          }
          h1 {
            font-size: 32px !important;
            letter-spacing: -1px !important;
          }
          h2 {
            font-size: 24px !important;
            letter-spacing: -0.5px !important;
          }
          h3 {
            font-size: 20px !important;
          }
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important;
            gap: 16px !important;
          }
          .stat-item {
            padding: 20px 16px !important;
          }
          .stat-number {
            font-size: 28px !important;
          }
          .social-links {
            gap: 12px !important;
          }
          .social-link {
            width: 48px !important;
            height: 48px !important;
            font-size: 16px !important;
          }
          .highlight-box {
            padding: 24px 20px !important;
            margin: 24px 0 !important;
          }
          .divider {
            margin: 36px 0 !important;
          }
        }
        
        @media only screen and (max-width: 480px) {
          .email-container { 
            margin: 8px !important; 
          }
          .content { 
            padding: 32px 20px !important; 
          }
          .header { 
            padding: 32px 20px !important; 
          }
          .card {
            padding: 24px 16px !important;
          }
          .btn { 
            padding: 14px 24px !important; 
            font-size: 14px !important; 
          }
          h1 {
            font-size: 28px !important;
          }
          h2 {
            font-size: 22px !important;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; background: linear-gradient(135deg, #F8FAFC 0%, #F0F4F8 25%, #E6F3FF 50%, #F3E8FF 75%, #FAF5FF 100%); min-height: 100vh; font-family: 'Inter', sans-serif;">
      ${
        preheader
          ? `<div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Inter', sans-serif; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">${preheader}</div>`
          : ""
      }
      
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Product Bazar</h1>
        </div>
        
        <div class="content">
          ${content}
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 24px 0; color: ${subtleColor}; font-size: 15px; line-height: 1.6; font-weight: 400;">
            You're receiving this email because you're part of the <strong>Product Bazar</strong> community.
          </p>
          <div class="social-links">
            <a href="mailto:hello@productbazar.com" class="social-link" title="Email us">
              <span>${getSVGIcon('mail', 18, '#6B7280')}</span>
            </a>
            <a href="#" class="social-link" title="Follow us on Twitter">
              <span>${getSVGIcon('twitter', 18, '#6B7280')}</span>
            </a>
            <a href="#" class="social-link" title="Connect on LinkedIn">
              <span>${getSVGIcon('linkedin', 18, '#6B7280')}</span>
            </a>
            <a href="#" class="social-link" title="Visit our GitHub">
              <span>${getSVGIcon('github', 18, '#6B7280')}</span>
            </a>
          </div>
          <div class="divider" style="margin: 32px 0; height: 1px;"></div>
          <p style="margin: 0; color: ${subtleColor}; font-size: 13px; line-height: 1.6; font-weight: 400;">
            © ${new Date().getFullYear()} <strong>Product Bazar</strong>. All rights reserved.<br>
            <a href="${
              process.env.CLIENT_URL
            }/unsubscribe" style="color: ${subtleColor}; text-decoration: none; font-weight: 500; border-bottom: 1px solid transparent; transition: all 0.3s ease;">Unsubscribe</a> • 
            <a href="${
              process.env.CLIENT_URL
            }/privacy" style="color: ${subtleColor}; text-decoration: none; font-weight: 500; border-bottom: 1px solid transparent; transition: all 0.3s ease;">Privacy Policy</a> • 
            <a href="${
              process.env.CLIENT_URL
            }/terms" style="color: ${subtleColor}; text-decoration: none; font-weight: 500; border-bottom: 1px solid transparent; transition: all 0.3s ease;">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Enhanced Verification Email
export const sendVerificationEmail = async (email, subject, message) => {
  try {
    if (!email) {
      logger.error("Cannot send verification email: No email address provided");
      return { success: false, error: "No email address provided" };
    }

    logger.info(`Sending verification email to: ${email}`);

    // Extract verification link from message if present
    const linkMatch = message.match(/https?:\/\/[^\s]+/);
    const verificationLink = linkMatch ? linkMatch[0] : null;
    const cleanMessage = message.replace(/https?:\/\/[^\s]+/, "").trim();

    const content = `
      <div style="text-align: center; margin-bottom: 48px;">
        <div class="icon-circle">
          <span style="position: relative; z-index: 3;">${getSVGIcon('sparkles', 42, '#ffffff')}</span>
        </div>
        <h1 style="color: #1A202C; font-size: 42px; font-weight: 900; margin: 0 0 20px 0; line-height: 1.1; background: linear-gradient(135deg, #1A202C 0%, #4A5568 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
          Welcome to Product Bazar
        </h1>
        <p style="color: #718096; font-size: 20px; margin: 0; max-width: 520px; margin: 0 auto; line-height: 1.6; font-weight: 400;">
          We're thrilled to have you join our vibrant community of innovative makers and visionary creators.
        </p>
      </div>

      <div class="card">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #8A2BE2 0%, #A855F7 100%); color: white; padding: 12px 24px; border-radius: 25px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);">
            Email Verification
          </div>
          <h2 style="color: #1A202C; font-size: 28px; font-weight: 800; margin: 0 0 16px 0; line-height: 1.2;">
            ${subject}
          </h2>
          <p style="color: #4A5568; font-size: 17px; line-height: 1.7; margin: 0; max-width: 460px; margin: 0 auto;">
            ${cleanMessage}
          </p>
        </div>
        
        ${
          verificationLink
            ? `
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationLink}" class="btn" style="font-size: 17px; padding: 20px 40px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
              ${getSVGIcon('shield', 20, '#ffffff')} Verify Email Address
            </a>
          </div>
          <div class="highlight-box" style="background: linear-gradient(135deg, #FEF7FF 0%, #F3E8FF 100%); border-color: rgba(139, 92, 246, 0.2);">
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #F59E0B 0%, #EAB308 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${getSVGIcon('lock', 18, '#ffffff')}
              </div>
              <div>
                <p style="color: #7C3AED; font-size: 15px; text-align: left; margin: 0; font-weight: 600; line-height: 1.5;">
                  <strong>Security Notice:</strong><br>
                  This secure verification link expires in 24 hours to protect your account.
                </p>
              </div>
            </div>
          </div>
        `
            : ""
        }
      </div>

      <div class="highlight-box" style="text-align: center; background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); border-color: rgba(14, 165, 233, 0.2);">
        <div style="margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            ${getSVGIcon('rocket', 28, '#ffffff')}
          </div>
          <h3 style="color: #0C4A6E; font-size: 24px; font-weight: 800; margin: 0 0 16px 0;">
            What's Next?
          </h3>
        </div>
        <p style="color: #075985; font-size: 16px; margin: 0 0 28px 0; line-height: 1.6; max-width: 440px; margin: 0 auto 28px;">
          Once verified, you'll unlock the full Product Bazar experience - showcase your innovations, discover cutting-edge solutions, and collaborate with creators worldwide.
        </p>
        <a href="${
          process.env.CLIENT_URL
        }" class="btn btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
          ${getSVGIcon('star', 16, '#8A2BE2')} Explore Product Bazar
        </a>
      </div>

      <div style="background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border: 1px solid #BBF7D0; border-radius: 16px; padding: 28px; margin: 32px 0; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 16px;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
            ${getSVGIcon('lightbulb', 20, '#ffffff')}
          </div>
          <h4 style="color: #065F46; font-size: 20px; font-weight: 700; margin: 0;">
            Pro Tip
          </h4>
        </div>
        <p style="color: #047857; font-size: 15px; margin: 0; line-height: 1.6; max-width: 400px; margin: 0 auto;">
          Complete your profile after verification to gain maximum visibility and build trust within our innovative community of makers and creators!
        </p>
      </div>
    `;

    const htmlContent = createEmailTemplate(content, {
      preheader: "Welcome to Product Bazar - Verify your email to get started",
    });

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
    return { success: false, error: error.message };
  }
};

// Enhanced Password Reset Email
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <div class="icon-circle">
          <span style="position: relative; z-index: 2;">${getSVGIcon('lock', 36, '#ffffff')}</span>
        </div>
        <h1 style="color: #1A202C; font-size: 36px; font-weight: 900; margin: 0 0 16px 0; line-height: 1.1;">
          Reset Your Password
        </h1>
        <p style="color: #718096; font-size: 18px; margin: 0; max-width: 480px; margin: 0 auto; line-height: 1.5;">
          Don't worry, we've got you covered. Let's get you back into your account.
        </p>
      </div>

      <div class="card">
        <div style="text-align: center; margin: 0 0 32px 0;">
          <div style="background: linear-gradient(135deg, #8A2BE2, #9D4EDD); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 24px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(138, 43, 226, 0.3);">
            ${getSVGIcon('key', 36, '#ffffff')}
          </div>
        </div>

        <h2 style="color: #1A202C; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center; background: linear-gradient(135deg, #8A2BE2, #9D4EDD); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
          Password Reset Request
        </h2>
        
        <p style="color: #4A5568; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
          We received a request to reset your password for your Product Bazar account. Don't worry, it happens to the best of us! Click the button below to create a new secure password.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" class="btn" style="background: linear-gradient(135deg, #8A2BE2 0%, #9D4EDD 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 10px 30px rgba(138, 43, 226, 0.3); transform: translateY(0); transition: all 0.3s ease;">
            ${getSVGIcon('unlock', 20, '#ffffff')} Reset Your Password
          </a>
        </div>
        
        <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FDE8E8 100%); border: 1px solid #FECACA; border-radius: 16px; padding: 24px; margin: 32px 0; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: linear-gradient(135deg, #DC2626, #EF4444); border-radius: 50%; opacity: 0.1;"></div>
          <div style="text-align: center;">
            <div style="background: linear-gradient(135deg, #DC2626, #EF4444); width: 48px; height: 48px; border-radius: 50%; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center;">
              ${getSVGIcon('alert', 20, '#ffffff')}
            </div>
            <h4 style="color: #DC2626; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">
              Security Notice
            </h4>
            <p style="color: #991B1B; font-size: 14px; margin: 0; line-height: 1.6;">
              This password reset link will expire in <strong style="background: linear-gradient(135deg, #DC2626, #EF4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">15 minutes</strong> for your security.
            </p>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border: 1px solid #E5E7EB; border-radius: 16px; padding: 28px; margin: 32px 0; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -30px; left: -30px; width: 80px; height: 80px; background: linear-gradient(135deg, #3B82F6, #1D4ED8); border-radius: 50%; opacity: 0.1;"></div>
          <div style="position: relative; z-index: 1;">
            <div style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
              ${getSVGIcon('help', 24, '#ffffff')}
            </div>
            <h3 style="color: #1A202C; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">
              Didn't request this?
            </h3>
            <p style="color: #4A5568; font-size: 14px; margin: 0; line-height: 1.6;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged, and your account is secure.
            </p>
          </div>
        </div>

        <div class="divider" style="margin: 40px 0;"></div>

        <div style="text-align: center; background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%); border: 1px solid #E9D5FF; border-radius: 16px; padding: 24px;">
          <p style="color: #6B46C1; font-size: 16px; margin: 0 0 16px 0; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
            ${getSVGIcon('help', 18, '#6B46C1')} Need help? Our support team is here for you
          </p>
          <a href="mailto:support@productbazar.com" style="color: #8A2BE2; text-decoration: none; font-weight: 600; background: linear-gradient(135deg, #8A2BE2 0%, #9D4EDD 100%); color: white; padding: 12px 24px; border-radius: 10px; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; box-shadow: 0 6px 20px rgba(138, 43, 226, 0.25); transition: all 0.3s ease;">
            ${getSVGIcon('mail', 16, '#ffffff')} Contact Support
          </a>
        </div>
    `;

    const htmlTemplate = createEmailTemplate(content, {
      preheader: "Reset your Product Bazar password securely and quickly",
    });

    return sendEmail({
      to: email,
      subject: "Reset Your Product Bazar Password",
      html: htmlTemplate,
      from: `"${process.env.EMAIL_FROM_NAME || "Product Bazar Security"}" <${
        process.env.EMAIL_FROM || "security@productbazar.com"
      }>`,
    });
  } catch (error) {
    logger.error(`Failed to send password reset email: ${error.message}`, {
      stack: error.stack,
    });
    throw new Error(`Password reset email sending failed: ${error.message}`);
  }
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

// Enhanced Collaborator Invitation Email
export const sendCollaboratorInvitationEmail = async (
  recipientEmail,
  projectTitle,
  projectSlug,
  inviterName,
  recipientName,
  role
) => {
  try {
    if (!recipientEmail) {
      logger.error(
        "Cannot send collaborator invitation: No email address provided"
      );
      return { success: false, error: "No email address provided" };
    }

    logger.info(`Sending collaborator invitation email to: ${recipientEmail}`);

    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <div class="icon-circle">
          <span style="position: relative; z-index: 2;">${getSVGIcon('handshake', 36, '#ffffff')}</span>
        </div>
        <h1 style="color: #1A202C; font-size: 36px; font-weight: 900; margin: 0 0 16px 0; line-height: 1.1;">
          You're Invited to Collaborate
        </h1>
        <p style="color: #718096; font-size: 18px; margin: 0; max-width: 480px; margin: 0 auto; line-height: 1.5;">
          Join an exciting project on Product Bazar and contribute to something amazing.
        </p>
      </div>

      <div class="card">
        <div style="text-align: center; margin-bottom: 28px;">
          <h2 style="color: #1A202C; font-size: 26px; font-weight: 700; margin: 0 0 16px 0;">
            "${projectTitle}"
          </h2>
          <div style="background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 100%); color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(138, 43, 226, 0.3);">
            ${role || "Contributor"} Role
          </div>
        </div>
        
        <div class="highlight-box">
          <p style="color: #4A5568; font-size: 16px; line-height: 1.7; margin: 0; text-align: center;">
            Hello <strong>${recipientName || "there"}</strong>!<br><br>
            <strong>${
              inviterName || "A fellow creator"
            }</strong> has invited you to collaborate on their project. They believe your skills and expertise would be a valuable addition to their team.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${
            process.env.CLIENT_URL
          }/projects/${projectSlug}" class="btn" style="display: inline-flex; align-items: center; gap: 8px;">
            ${getSVGIcon('rocket', 18, '#ffffff')} View Project & Accept Invitation
          </a>
        </div>
        
        <div style="border-top: 2px solid #F1F5F9; padding-top: 24px; margin-top: 28px;">
          <h4 style="color: #1A202C; font-size: 18px; font-weight: 700; margin: 0 0 16px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
            ${getSVGIcon('star', 16, '#1A202C')} As a ${role || "contributor"}, you'll be able to:
          </h4>
          <div style="background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); border-radius: 12px; padding: 20px; margin: 16px 0;">
            <ul style="color: #0369A1; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                ${getSVGIcon('target', 14, '#0369A1')} Contribute to project development and discussions
              </li>
              <li style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                ${getSVGIcon('lightbulb', 14, '#0369A1')} Access project resources and documentation
              </li>
              <li style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                ${getSVGIcon('users', 14, '#0369A1')} Collaborate with other talented team members
              </li>
              <li style="display: flex; align-items: center; gap: 8px;">
                ${getSVGIcon('trending', 14, '#0369A1')} Help shape the project's direction and success
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="highlight-box" style="text-align: center;">
        <h3 style="color: #1A202C; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
          ${getSVGIcon('star', 18, '#1A202C')} New to Product Bazar?
        </h3>
        <p style="color: #4A5568; font-size: 16px; margin: 0 0 24px 0; line-height: 1.6;">
          Join our community of makers and innovators. Showcase your work, discover amazing products, and collaborate with creators worldwide.
        </p>
        <a href="${
          process.env.CLIENT_URL
        }/auth/register" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
          ${getSVGIcon('sparkles', 16, '#8A2BE2')} Create Your Account
        </a>
      </div>

      <div class="divider"></div>

      <div style="text-align: center;">
        <p style="color: #718096; font-size: 14px; margin: 0 0 8px 0;">
          Questions about this invitation?
        </p>
        <p style="color: #718096; font-size: 14px; margin: 0;">
          Contact <a href="mailto:${
            inviterName
              ? `${inviterName
                  .toLowerCase()
                  .replace(" ", ".")}@productbazar.com`
              : "support@productbazar.com"
          }" style="color: #8A2BE2; text-decoration: none; font-weight: 600;">${
      inviterName || "our support team"
    }</a> or visit our <a href="${
      process.env.CLIENT_URL
    }/help" style="color: #8A2BE2; text-decoration: none; font-weight: 600;">Help Center</a>
        </p>
      </div>
    `;

    const htmlContent = createEmailTemplate(content, {
      preheader: `${
        inviterName || "Someone"
      } has invited you to collaborate on "${projectTitle}"`,
    });

    const result = await sendEmail({
      to: recipientEmail,
      subject: `You've been invited to collaborate on "${projectTitle}"`,
      html: htmlContent,
      from: `"${process.env.EMAIL_FROM_NAME || "Product Bazar"}" <${
        process.env.EMAIL_FROM || "noreply@productbazar.com"
      }>`,
    });

    logger.info(
      `Collaborator invitation email sent successfully to: ${recipientEmail}`
    );
    return { success: true };
  } catch (error) {
    logger.error(
      `Failed to send collaborator invitation email: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return { success: false, error: error.message };
  }
};

// Enhanced Welcome Email for New Users
export const sendWelcomeEmail = async (email, userName, userType = "maker") => {
  try {
    if (!email) {
      logger.error("Cannot send welcome email: No email address provided");
      return { success: false, error: "No email address provided" };
    }

    logger.info(`Sending welcome email to: ${email}`);

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
          ${getSVGIcon('sparkles', 32, '#ffffff')}
        </div>
        <h1 style="color: #2D3748; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.2;">
          Welcome to Product Bazar, ${userName}!
        </h1>
        <p style="color: #718096; font-size: 18px; margin: 0; max-width: 500px; margin: 0 auto;">
          You've successfully joined our vibrant community of innovators, creators, and early adopters.
        </p>
      </div>

      <div class="card">
        <h2 style="color: #2D3748; font-size: 24px; font-weight: 600; margin: 0 0 20px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
          ${getSVGIcon('rocket', 20, '#2D3748')} Let's Get You Started
        </h2>
        
        <div style="display: grid; gap: 16px; margin: 24px 0;">
          ${
            userType === "maker"
              ? `
            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px;">
              <h4 style="color: #166534; font-size: 16px; font-weight: 600; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                ${getSVGIcon('lightbulb', 16, '#166534')} Submit Your First Product
              </h4>
              <p style="color: #166534; font-size: 14px; margin: 0; line-height: 1.5;">
                Share your innovative products with our community and get valuable feedback.
              </p>
            </div>
            
            <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px;">
              <h4 style="color: #1D4ED8; font-size: 16px; font-weight: 600; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                ${getSVGIcon('users', 16, '#1D4ED8')} Connect with Collaborators
              </h4>
              <p style="color: #1D4ED8; font-size: 14px; margin: 0; line-height: 1.5;">
                Find like-minded creators and build amazing things together.
              </p>
            </div>
          `
              : `
            <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px;">
              <h4 style="color: #92400E; font-size: 16px; font-weight: 600; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                ${getSVGIcon('target', 16, '#92400E')} Discover Amazing Products
              </h4>
              <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.5;">
                Explore innovative products from talented creators around the world.
              </p>
            </div>
            
            <div style="background: #FDF2F8; border: 1px solid #FBCFE8; border-radius: 8px; padding: 16px;">
              <h4 style="color: #BE185D; font-size: 16px; font-weight: 600; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
                ${getSVGIcon('star', 16, '#BE185D')} Support Creators
              </h4>
              <p style="color: #BE185D; font-size: 14px; margin: 0; line-height: 1.5;">
                Upvote products you love and provide feedback to help creators improve.
              </p>
            </div>
          `
          }
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard" class="btn">
            Explore Your Dashboard
          </a>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #F7FAFC 0%, #E6FFFA 100%); padding: 24px; border-radius: 12px; margin: 24px 0;">
        <h3 style="color: #2D3748; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
          ${getSVGIcon('lightbulb', 20, '#2D3748')} Quick Start Guide
        </h3>
        <ul style="color: #4A5568; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Complete your profile to build trust with the community</li>
          <li>Browse trending products for inspiration</li>
          <li>Join discussions and provide valuable feedback</li>
          <li>Follow creators whose work inspires you</li>
          ${
            userType === "maker"
              ? "<li>Prepare your first product submission with clear descriptions and visuals</li>"
              : "<li>Create collections of products you love</li>"
          }
        </ul>
      </div>
    `;

    const htmlContent = createEmailTemplate(content, {
      preheader: `Welcome to Product Bazar! Start your journey as a ${userType} today.`,
    });

    const result = await sendEmail({
      to: email,
      subject: `Welcome to Product Bazar, ${userName}!`,
      html: htmlContent,
      from: `"${process.env.EMAIL_FROM_NAME || "Product Bazar Team"}" <${
        process.env.EMAIL_FROM || "welcome@productbazar.com"
      }>`,
    });

    logger.info(`Welcome email sent successfully to: ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send welcome email: ${error.message}`, {
      stack: error.stack,
    });
    return { success: false, error: error.message };
  }
};

// Product Featured/Trending Notification Email
export const sendProductFeaturedEmail = async (
  email,
  userName,
  productTitle,
  productSlug,
  reason = "trending"
) => {
  try {
    if (!email) {
      logger.error(
        "Cannot send product featured email: No email address provided"
      );
      return { success: false, error: "No email address provided" };
    }

    logger.info(`Sending product featured email to: ${email}`);

    const reasonIcon =
      reason === "trending" ? getSVGIcon('trending', 32, '#ffffff') : reason === "featured" ? getSVGIcon('star', 32, '#ffffff') : getSVGIcon('target', 32, '#ffffff');
    const reasonText =
      reason === "trending"
        ? "trending"
        : reason === "featured"
        ? "featured"
        : "highlighted";

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
          ${reasonIcon}
        </div>
        <h1 style="color: #2D3748; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.2;">
          Congratulations, ${userName}!
        </h1>
        <p style="color: #718096; font-size: 18px; margin: 0; max-width: 400px; margin: 0 auto;">
          Your product is gaining amazing traction in our community.
        </p>
      </div>

      <div class="card">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 100%); color: white; padding: 12px 24px; border-radius: 25px; display: inline-block; font-size: 16px; font-weight: 600; margin-bottom: 16px;">
            ${reasonText.toUpperCase()} PRODUCT
          </div>
          <h2 style="color: #2D3748; font-size: 24px; font-weight: 600; margin: 0;">
            "${productTitle}"
          </h2>
        </div>
        
        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
          <h3 style="color: #166534; font-size: 20px; font-weight: 600; margin: 0 0 12px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
            ${getSVGIcon('star', 20, '#166534')} Your Product is ${
              reasonText.charAt(0).toUpperCase() + reasonText.slice(1)
            }
          </h3>
          <p style="color: #166534; font-size: 16px; margin: 0; line-height: 1.6;">
            Your innovative product has caught the attention of our community and is now being showcased to more creators and enthusiasts.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${
            process.env.CLIENT_URL
          }/product/${productSlug}" class="btn">
            View Your Product
          </a>
        </div>
        
        <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; margin-top: 24px;">
          <h4 style="color: #2D3748; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
            What this means for you: 
          </h4>
          <ul style="color: #4A5568; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Increased visibility across the platform</li>
            <li>More engagement from potential users and collaborators</li>
            <li>Enhanced credibility in the Product Bazar community</li>
            <li>Potential for collaboration opportunities</li>
          </ul>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #F7FAFC 0%, #E6FFFA 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <h3 style="color: #2D3748; font-size: 20px; font-weight: 600; margin: 0 0 12px 0;">
          Keep the Momentum Going
        </h3>
        <p style="color: #4A5568; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
          Engage with your community, respond to comments, and consider sharing more about your creation process.
        </p>
        <a href="${process.env.CLIENT_URL}/dashboard" class="btn btn-secondary">
          View Analytics
        </a>
      </div>
    `;

    const htmlContent = createEmailTemplate(content, {
      preheader: `Great news! Your product "${productTitle}" is now ${reasonText} on Product Bazar.`,
    });

    const result = await sendEmail({
      to: email,
      subject: `Your product "${productTitle}" is now ${reasonText}!`,
      html: htmlContent,
      from: `"${process.env.EMAIL_FROM_NAME || "Product Bazar"}" <${
        process.env.EMAIL_FROM || "notifications@productbazar.com"
      }>`,
    });

    logger.info(`Product featured email sent successfully to: ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send product featured email: ${error.message}`, {
      stack: error.stack,
    });
    return { success: false, error: error.message };
  }
};

// Weekly Digest Email
export const sendWeeklyDigestEmail = async (
  email,
  userName,
  weeklyStats,
  featuredProducts
) => {
  try {
    if (!email) {
      logger.error(
        "Cannot send weekly digest email: No email address provided"
      );
      return { success: false, error: "No email address provided" };
    }

    logger.info(`Sending weekly digest email to: ${email}`);

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
          ${getSVGIcon('trending', 32, '#ffffff')}
        </div>
        <h1 style="color: #2D3748; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.2;">
          Your Weekly Digest
        </h1>
        <p style="color: #718096; font-size: 18px; margin: 0; max-width: 400px; margin: 0 auto;">
          Here's what happened in your Product Bazar community this week.
        </p>
      </div>

      ${
        weeklyStats
          ? `
        <div class="card">
          <h2 style="color: #2D3748; font-size: 24px; font-weight: 600; margin: 0 0 20px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
            ${getSVGIcon('chart', 24, '#2D3748')} Your Week in Numbers
          </h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; margin: 24px 0;">
            <div style="text-align: center; background: #F7FAFC; padding: 16px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: 700; color: #8A2BE2; margin-bottom: 4px;">
                ${weeklyStats.views || 0}
              </div>
              <div style="font-size: 12px; color: #718096; font-weight: 500;">
                PRODUCT VIEWS
              </div>
            </div>
            
            <div style="text-align: center; background: #F7FAFC; padding: 16px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: 700; color: #8A2BE2; margin-bottom: 4px;">
                ${weeklyStats.upvotes || 0}
              </div>
              <div style="font-size: 12px; color: #718096; font-weight: 500;">
                NEW UPVOTES
              </div>
            </div>
            
            <div style="text-align: center; background: #F7FAFC; padding: 16px; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: 700; color: #8A2BE2; margin-bottom: 4px;">
                ${weeklyStats.comments || 0}
              </div>
              <div style="font-size: 12px; color: #718096; font-weight: 500;">
                COMMENTS
              </div>
            </div>
          </div>
        </div>
      `
          : ""
      }

      ${
        featuredProducts && featuredProducts.length > 0
          ? `
        <div class="card">
          <h2 style="color: #2D3748; font-size: 24px; font-weight: 600; margin: 0 0 20px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
            ${getSVGIcon('trending', 24, '#2D3748')} Trending This Week
          </h2>
          
          ${featuredProducts
            .slice(0, 3)
            .map(
              (product) => `
            <div style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 12px 0; background: #FAFAFA;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #8A2BE2 0%, #9932CC 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-weight: 600;">${product.title.charAt(
                    0
                  )}</span>
                </div>
                <div style="flex: 1;">
                  <h4 style="color: #2D3748; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">
                    ${product.title}
                  </h4>
                  <p style="color: #718096; font-size: 14px; margin: 0;">
                    ${product.upvotes || 0} upvotes • ${
                product.views || 0
              } views
                  </p>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
          
          <div style="text-align: center; margin: 24px 0 0 0;">
            <a href="${
              process.env.CLIENT_URL
            }/trending" class="btn btn-secondary">
              See All Trending Products
            </a>
          </div>
        </div>
      `
          : ""
      }

      <div style="background: linear-gradient(135deg, #F7FAFC 0%, #E6FFFA 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <h3 style="color: #2D3748; font-size: 20px; font-weight: 600; margin: 0 0 12px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
          ${getSVGIcon('rocket', 20, '#2D3748')} Keep Building & Discovering
        </h3>
        <p style="color: #4A5568; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
          Every week brings new opportunities to connect, create, and innovate. What will you discover next?
        </p>
        <a href="${process.env.CLIENT_URL}" class="btn">
          Explore Product Bazar
        </a>
      </div>
    `;

    const htmlContent = createEmailTemplate(content, {
      preheader: `Your weekly Product Bazar digest - trending products and your stats inside!`,
    });

    const result = await sendEmail({
      to: email,
      subject: `Your Weekly Product Bazar Digest`,
      html: htmlContent,
      from: `"${process.env.EMAIL_FROM_NAME || "Product Bazar Digest"}" <${
        process.env.EMAIL_FROM || "digest@productbazar.com"
      }>`,
    });

    logger.info(`Weekly digest email sent successfully to: ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send weekly digest email: ${error.message}`, {
      stack: error.stack,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced email validation utility
 */
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Generate unsubscribe link with token
 */
export const generateUnsubscribeLink = (email, type = "all") => {
  const token = Buffer.from(`${email}:${type}:${Date.now()}`).toString(
    "base64"
  );
  return `${process.env.CLIENT_URL}/unsubscribe?token=${token}`;
};

/**
 * Batch email sending utility
 */
export const sendBulkEmails = async (
  emailList,
  templateFunction,
  templateData
) => {
  const results = [];
  const batchSize = 10; // Send emails in batches to avoid overwhelming the SMTP server

  for (let i = 0; i < emailList.length; i += batchSize) {
    const batch = emailList.slice(i, i + batchSize);
    const batchPromises = batch.map(async (email) => {
      try {
        const result = await templateFunction(email, ...templateData);
        return { email, success: true, result };
      } catch (error) {
        logger.error(`Failed to send email to ${email}: ${error.message}`);
        return { email, success: false, error: error.message };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map((r) => r.value || r.reason));

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < emailList.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
};

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendCollaboratorInvitationEmail,
  sendWelcomeEmail,
  sendProductFeaturedEmail,
  sendWeeklyDigestEmail,
  verifyConnection,
  maskEmail,
  validateEmail,
  generateUnsubscribeLink,
  sendBulkEmails,
  createEmailTemplate,
};

import nodemailer from 'nodemailer';
import { emailConfig, emailFrom } from '../config/email';

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
  }>;
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  try {
    const info = await transporter.sendMail({
      from: `${emailFrom.name} <${emailFrom.address}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Email Templates

export const invoiceEmailTemplate = (
  invoiceNumber: string,
  clientName: string,
  amount: string,
  dueDate: string,
  companyName: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .invoice-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; }
        .detail-value { font-weight: bold; color: #1f2937; }
        .amount { font-size: 24px; color: #2563eb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          <p>Invoice Notification</p>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>Thank you for your business! Please find your invoice details below:</p>
          
          <div class="invoice-details">
            <div class="detail-row">
              <span class="detail-label">Invoice Number:</span>
              <span class="detail-value">${invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Due Date:</span>
              <span class="detail-value">${dueDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount Due:</span>
              <span class="detail-value amount">${amount}</span>
            </div>
          </div>
          
          <p>The invoice is attached to this email. Please review and process the payment at your earliest convenience.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <div class="footer">
            <p>Best regards,<br>${companyName}</p>
            <p style="font-size: 12px; color: #9ca3af;">This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const paymentReminderTemplate = (
  invoiceNumber: string,
  clientName: string,
  amount: string,
  dueDate: string,
  daysOverdue: number,
  companyName: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #fef2f2; padding: 30px; border-radius: 0 0 5px 5px; }
        .alert { background: white; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; }
        .detail-row { padding: 10px 0; }
        .amount { font-size: 24px; color: #ef4444; font-weight: bold; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          
          <div class="alert">
            <p style="margin: 0; color: #ef4444; font-weight: bold;">⚠️ Payment Overdue</p>
            <p style="margin: 10px 0 0 0;">This is a friendly reminder that invoice ${invoiceNumber} is now <strong>${daysOverdue} days overdue</strong>.</p>
          </div>
          
          <div class="detail-row">
            <strong>Invoice Number:</strong> ${invoiceNumber}<br>
            <strong>Original Due Date:</strong> ${dueDate}<br>
            <strong>Amount Due:</strong> <span class="amount">${amount}</span>
          </div>
          
          <p>We kindly request that you process this payment as soon as possible. If you have already made the payment, please disregard this reminder.</p>
          
          <p>If you're experiencing any issues with payment or have questions about this invoice, please contact us immediately.</p>
          
          <div class="footer">
            <p>Thank you,<br>${companyName}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const paymentReceivedTemplate = (
  invoiceNumber: string,
  clientName: string,
  amount: string,
  paymentDate: string,
  companyName: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 5px 5px; }
        .success { background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        .amount { font-size: 24px; color: #10b981; font-weight: bold; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Payment Received</h1>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          
          <div class="success">
            <p style="margin: 0; color: #10b981; font-weight: bold;">Payment Confirmed</p>
            <p style="margin: 10px 0 0 0;">We have received your payment. Thank you!</p>
          </div>
          
          <div style="padding: 10px 0;">
            <strong>Invoice Number:</strong> ${invoiceNumber}<br>
            <strong>Payment Date:</strong> ${paymentDate}<br>
            <strong>Amount Paid:</strong> <span class="amount">${amount}</span>
          </div>
          
          <p>This invoice is now marked as paid in our system. We appreciate your prompt payment and continued business.</p>
          
          <div class="footer">
            <p>Best regards,<br>${companyName}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
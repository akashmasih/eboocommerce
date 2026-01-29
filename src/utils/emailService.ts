import axios from 'axios';
import sgMail from '@sendgrid/mail';
import { logger } from '../shared/utils/logger';
import { publishEvent } from '../shared/utils/eventBus';

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'notification-service';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const RESET_PASSWORD_URL = process.env.RESET_PASSWORD_URL || `${FRONTEND_URL}/reset-password`;
const VERIFY_EMAIL_URL = process.env.VERIFY_EMAIL_URL || `${FRONTEND_URL}/verify-email`;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email Service - Sends emails via different providers
 */
export class EmailService {
  /**
   * Send email via configured provider
   * Returns email sending status for verification
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
    const startTime = Date.now();
    logger.info({ 
      to: options.to, 
      subject: options.subject, 
      provider: EMAIL_PROVIDER 
    }, 'Attempting to send email');

    try {
      let result;
      switch (EMAIL_PROVIDER) {
        case 'notification-service':
          result = await this.sendViaNotificationService(options);
          break;
        case 'smtp':
          result = await this.sendViaSMTP(options);
          break;
        case 'sendgrid':
          result = await this.sendViaSendGrid(options);
          break;
        case 'mailgun':
          result = await this.sendViaMailgun(options);
          break;
        default:
          logger.warn(`Unknown email provider: ${EMAIL_PROVIDER}, using notification-service`);
          result = await this.sendViaNotificationService(options);
      }

      const duration = Date.now() - startTime;
      logger.info({ 
        to: options.to, 
        subject: options.subject, 
        provider: EMAIL_PROVIDER,
        success: true,
        duration: `${duration}ms`,
        messageId: result?.messageId
      }, 'Email sent successfully');

      return {
        success: true,
        provider: EMAIL_PROVIDER,
        messageId: result?.messageId
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({ 
        error: error.message, 
        to: options.to,
        subject: options.subject,
        provider: EMAIL_PROVIDER,
        duration: `${duration}ms`,
        stack: error.stack
      }, 'Failed to send email');
      
      return {
        success: false,
        provider: EMAIL_PROVIDER,
        error: error.message
      };
    }
  }

  /**
   * Send via notification service (RabbitMQ or HTTP)
   */
  private async sendViaNotificationService(options: EmailOptions): Promise<{ messageId?: string }> {
    try {
      // Try to publish via event bus
      await publishEvent('notifications', 'email.send', {
        to: options.to,
        subject: options.subject,
        message: options.text || options.html.replace(/<[^>]*>/g, ''),
        html: options.html
      });
      logger.info({ to: options.to, subject: options.subject }, 'Email event published to RabbitMQ');
      return { messageId: 'queued-via-rabbitmq' };
    } catch (error) {
      // Fallback: Call notification service directly via HTTP
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4010';
      try {
        const response = await axios.post(`${notificationServiceUrl}/api/notifications/send`, {
          userId: null,
          channel: 'EMAIL',
          message: `Subject: ${options.subject}\n\n${options.text || options.html.replace(/<[^>]*>/g, '')}`
        });
        logger.info({ 
          to: options.to, 
          subject: options.subject,
          notificationId: response.data?.id 
        }, 'Email sent via notification service HTTP');
        return { messageId: response.data?.id || 'queued-via-http' };
      } catch (httpError: any) {
        logger.warn({ 
          error: httpError.message,
          to: options.to,
          subject: options.subject
        }, 'Failed to send email via notification service');
        throw new Error(`Notification service error: ${httpError.message}`);
      }
    }
  }

  /**
   * Send via SMTP
   */
  private async sendViaSMTP(options: EmailOptions): Promise<{ messageId?: string }> {
    // For production, use nodemailer
    // This is a placeholder - implement with nodemailer if needed
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });

    logger.info({ 
      to: options.to, 
      subject: options.subject,
      messageId: info.messageId 
    }, 'Email sent via SMTP');

    return { messageId: info.messageId };
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(options: EmailOptions): Promise<{ messageId?: string }> {
    // Initialize SendGrid with API key
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'E-boo Platform';
    const replyTo = process.env.SENDGRID_REPLY_TO || fromEmail;

    const msg = {
      to: options.to,
      from: {
        email: fromEmail,
        name: fromName
      },
      replyTo: replyTo,
      subject: options.subject,
      text: options.text || this.stripHtml(options.html),
      html: options.html,
      // Add headers to improve deliverability
      headers: {
        'X-Entity-Ref-ID': this.generateMessageId(),
        'List-Unsubscribe': `<${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      },
      // Add categories for tracking
      categories: ['transactional', 'authentication'],
      // Mail settings for better deliverability
      mailSettings: {
        sandboxMode: {
          enable: process.env.SENDGRID_SANDBOX_MODE === 'true' ? true : false
        }
      }
    };

    const [response] = await sgMail.send(msg);
    
    logger.info({ 
      to: options.to, 
      subject: options.subject,
      statusCode: response.statusCode,
      headers: response.headers
    }, 'Email sent via SendGrid');

    // SendGrid returns message ID in headers
    const messageId = response.headers['x-message-id'] || response.headers['X-Message-Id'];
    
    return { messageId: messageId as string };
  }

  /**
   * Strip HTML tags to create plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Generate unique message ID for tracking
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Send via Mailgun
   */
  private async sendViaMailgun(options: EmailOptions): Promise<{ messageId?: string }> {
    const domain = process.env.MAILGUN_DOMAIN;
    const response = await axios.post(
      `https://api.mailgun.net/v3/${domain}/messages`,
      new URLSearchParams({
        from: process.env.MAILGUN_FROM_EMAIL || `noreply@${domain}`,
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
        html: options.html
      }),
      {
        auth: {
          username: 'api',
          password: process.env.MAILGUN_API_KEY || ''
        }
      }
    );

    logger.info({ 
      to: options.to, 
      subject: options.subject,
      messageId: response.data?.id 
    }, 'Email sent via Mailgun');

    return { messageId: response.data?.id };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
    const resetUrl = `${RESET_PASSWORD_URL}?token=${token}`;
    const companyName = process.env.COMPANY_NAME || 'E-boo Platform';
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'support@yourdomain.com';
    
    return await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - ' + companyName,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Reset Your Password</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333333; 
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            .email-header {
              background-color: #007bff;
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .email-header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .email-body {
              padding: 40px 30px;
            }
            .email-body h2 {
              color: #333333;
              font-size: 20px;
              margin-top: 0;
              margin-bottom: 20px;
            }
            .email-body p {
              color: #666666;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background-color: #007bff;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: 600;
              font-size: 16px;
            }
            .button:hover {
              background-color: #0056b3;
            }
            .link-text {
              word-break: break-all;
              color: #007bff;
              font-size: 14px;
            }
            .warning-box {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
            }
            .warning-box p {
              margin: 0;
              color: #856404;
              font-size: 14px;
            }
            .email-footer {
              background-color: #f8f9fa;
              padding: 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
            }
            .email-footer a {
              color: #007bff;
              text-decoration: none;
            }
            .email-footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-header">
              <h1>${companyName}</h1>
            </div>
            <div class="email-body">
              <h2>Password Reset Request</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password for your ${companyName} account. Click the button below to create a new password:</p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p class="link-text">${resetUrl}</p>
              
              <div class="warning-box">
                <p><strong>Important:</strong> This link will expire in 24 hours. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              </div>
              
              <p>For security reasons, if you didn't request this password reset, please contact our support team immediately.</p>
            </div>
            <div class="email-footer">
              <p>This is an automated message from ${companyName}.</p>
              <p>If you have questions, contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
              <p style="margin-top: 20px; font-size: 12px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe">Unsubscribe</a> | 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy">Privacy Policy</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Password Reset Request

Hello,

We received a request to reset your password for your ${companyName} account.

Click this link to reset your password:
${resetUrl}

This link will expire in 24 hours.

If you didn't request a password reset, please ignore this email or contact support at ${supportEmail}.

This is an automated message from ${companyName}.`
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
    const verifyUrl = `${VERIFY_EMAIL_URL}?token=${token}`;
    const companyName = process.env.COMPANY_NAME || 'E-boo Platform';
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'support@yourdomain.com';
    
    return await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - ' + companyName,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Verify Your Email</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333333; 
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            .email-header {
              background-color: #28a745;
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .email-header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .email-body {
              padding: 40px 30px;
            }
            .email-body h2 {
              color: #333333;
              font-size: 20px;
              margin-top: 0;
              margin-bottom: 20px;
            }
            .email-body p {
              color: #666666;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background-color: #28a745;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: 600;
              font-size: 16px;
            }
            .button:hover {
              background-color: #218838;
            }
            .link-text {
              word-break: break-all;
              color: #28a745;
              font-size: 14px;
            }
            .info-box {
              background-color: #d1ecf1;
              border-left: 4px solid #17a2b8;
              padding: 15px;
              margin: 20px 0;
            }
            .info-box p {
              margin: 0;
              color: #0c5460;
              font-size: 14px;
            }
            .email-footer {
              background-color: #f8f9fa;
              padding: 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
            }
            .email-footer a {
              color: #28a745;
              text-decoration: none;
            }
            .email-footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-header">
              <h1>Welcome to ${companyName}</h1>
            </div>
            <div class="email-body">
              <h2>Verify Your Email Address</h2>
              <p>Hello,</p>
              <p>Thank you for signing up! We're excited to have you on board. To complete your registration, please verify your email address by clicking the button below:</p>
              
              <div class="button-container">
                <a href="${verifyUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p class="link-text">${verifyUrl}</p>
              
              <div class="info-box">
                <p><strong>Note:</strong> This verification link will expire in 72 hours. If you didn't create an account with us, please ignore this email.</p>
              </div>
              
              <p>Once verified, you'll have full access to all features of ${companyName}.</p>
            </div>
            <div class="email-footer">
              <p>This is an automated message from ${companyName}.</p>
              <p>If you have questions, contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
              <p style="margin-top: 20px; font-size: 12px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe">Unsubscribe</a> | 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy">Privacy Policy</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Verify Your Email Address

Hello,

Thank you for signing up for ${companyName}! To complete your registration, please verify your email address.

Click this link to verify your email:
${verifyUrl}

This verification link will expire in 72 hours.

If you didn't create an account with us, please ignore this email.

Once verified, you'll have full access to all features.

If you have questions, contact us at ${supportEmail}.

This is an automated message from ${companyName}.`
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();

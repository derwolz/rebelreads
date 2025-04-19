import sgMail from '@sendgrid/mail';
import { 
  welcomeEmailTemplate, 
  signupInterestEmailTemplate, 
  betaKeyRequiredEmailTemplate,
  emailVerificationTemplate,
  loginVerificationTemplate,
  passwordResetTemplate
} from './templates';

/**
 * Email Service for sending automated emails using SendGrid
 */
export class EmailService {
  private static instance: EmailService;
  private isConfigured: boolean = false;

  private constructor() {
    // Check if we have the required environment variables
    const { SENDGRID_API_KEY, EMAIL_FROM } = process.env;

    if (SENDGRID_API_KEY) {
      // Set the SendGrid API key
      sgMail.setApiKey(SENDGRID_API_KEY);
      this.isConfigured = true;
    } else {
      console.warn('Email service not configured: Missing SENDGRID_API_KEY environment variable');
    }
  }

  /**
   * Gets the singleton instance of EmailService
   */
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Checks if the email service is properly configured
   */
  public isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Sends an email using SendGrid
   */
  public async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    try {
      // If not configured, just log the email and return success
      if (!this.isConfigured) {
        console.log('Email not sent (SendGrid not configured):', {
          to,
          subject,
          html: html.substring(0, 100) + '...',
          text: text.substring(0, 100) + '...'
        });
        return true;
      }

      const msg = {
        to,
        from: process.env.EMAIL_FROM || 'noreply@sirened.com',
        subject,
        text,
        html,
      };

      const result = await sgMail.send(msg);
      console.log('Email sent:', result);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Sends a welcome email to a new user
   */
  public async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const template = welcomeEmailTemplate(username);
    return this.sendEmail(email, template.subject, template.html, template.text);
  }

  /**
   * Sends a signup interest confirmation email
   */
  public async sendSignupInterestEmail(email: string): Promise<boolean> {
    const template = signupInterestEmailTemplate(email);
    return this.sendEmail(email, template.subject, template.html, template.text);
  }

  /**
   * Sends a beta key required notification email
   */
  public async sendBetaKeyRequiredEmail(email: string): Promise<boolean> {
    const template = betaKeyRequiredEmailTemplate(email);
    return this.sendEmail(email, template.subject, template.html, template.text);
  }

  /**
   * Sends an email verification code
   */
  public async sendEmailVerificationCode(email: string, username: string, verificationCode: string): Promise<boolean> {
    const template = emailVerificationTemplate(username, verificationCode);
    return this.sendEmail(email, template.subject, template.html, template.text);
  }

  /**
   * Sends a login verification code when detected from a new device/location
   */
  public async sendLoginVerificationCode(email: string, username: string, verificationCode: string, ipAddress: string, userAgent: string): Promise<boolean> {
    const template = loginVerificationTemplate(username, verificationCode, ipAddress, userAgent);
    return this.sendEmail(email, template.subject, template.html, template.text);
  }

  /**
   * Sends a password reset code
   */
  public async sendPasswordResetCode(email: string, username: string, verificationCode: string): Promise<boolean> {
    const template = passwordResetTemplate(username, verificationCode);
    return this.sendEmail(email, template.subject, template.html, template.text);
  }
}
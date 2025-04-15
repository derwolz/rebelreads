import { EmailService } from './email-service';
import { 
  welcomeEmailTemplate, 
  signupInterestEmailTemplate, 
  betaKeyRequiredEmailTemplate,
  waitlistWelcomeEmailTemplate
} from './templates';

export { 
  EmailService,
  welcomeEmailTemplate,
  signupInterestEmailTemplate,
  betaKeyRequiredEmailTemplate,
  waitlistWelcomeEmailTemplate
};

// Export a singleton instance for convenience
export const emailService = EmailService.getInstance();
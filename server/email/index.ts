import { EmailService } from './email-service';
import { 
  welcomeEmailTemplate, 
  signupInterestEmailTemplate, 
  betaKeyRequiredEmailTemplate 
} from './templates';

export { 
  EmailService,
  welcomeEmailTemplate,
  signupInterestEmailTemplate,
  betaKeyRequiredEmailTemplate
};

// Export a singleton instance for convenience
export const emailService = EmailService.getInstance();
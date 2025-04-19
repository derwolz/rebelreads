/**
 * Email validation utilities to prevent botting attacks
 * - Normalizes email addresses to detect aliases
 * - Checks for disposable/temporary email domains
 * - Validates email format and structure
 */

/**
 * List of common disposable email domains that should be blocked
 */
export const BLOCKED_EMAIL_DOMAINS = [
  // Temporary/disposable email services
  "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com", "guerrillamail.info",
  "sharklasers.com", "grr.la", "getairmail.com", "yopmail.com", "tempinbox.com", "dispostable.com",
  "mailnesia.com", "mailnator.com", "trashmail.com", "mailcatch.com", "maildrop.cc", "harakirimail.com",
  "1secmail.com", "temp-mail.org", "fake-email.org", "throwawaymail.com", "getnada.com", "inboxalias.com",
  
  // Free domains with minimal verification that are commonly abused by bots
  "qq.com", "cock.li", "cock.email", "nazi.email", "waifu.club", "wants.dick.for.christmas",
  "redchan.it", "hitler.rocks", "getbackinthe.kitchen", "dicksinhisan.us", "loves.dicksinhisan.us",
  "nigge.rs", "420blaze.it", "is-a.spamgourmet.com", "spam4.me", "mailezee.com",
  "zoho.com", "spamgourmet.com", "spam4.me", "disroot.org", "email01.net",
];

/**
 * Normalizes an email address to handle alias variations:
 * - Removes Gmail dots (since gmail ignores dots in addresses)
 * - Removes Gmail plus aliases (anything after + in the local part)
 * - Standardizes to lowercase
 * 
 * @param email The email address to normalize
 * @returns A normalized email address to use for duplicate detection
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  
  // Convert to lowercase
  email = email.toLowerCase().trim();
  
  // Split into local part and domain
  const [localPart, domain] = email.split('@');
  
  // If not a valid email format, return as is
  if (!domain || !localPart) return email;
  
  let normalizedLocal = localPart;
  
  // Handle Gmail-specific normalization
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove dots (Gmail ignores dots)
    normalizedLocal = normalizedLocal.replace(/\./g, '');
    
    // Remove plus aliases (anything after + is ignored by Gmail)
    normalizedLocal = normalizedLocal.split('+')[0];
  }
  
  // Handle common Yahoo aliases
  if (domain === 'yahoo.com') {
    // Remove dash aliases (yahoo allows username-keyword)
    normalizedLocal = normalizedLocal.split('-')[0];
  }
  
  // Handle Outlook/Hotmail aliases
  if (['outlook.com', 'hotmail.com', 'live.com'].includes(domain)) {
    // Remove plus aliases (similar to Gmail)
    normalizedLocal = normalizedLocal.split('+')[0];
  }
  
  return `${normalizedLocal}@${domain}`;
}

/**
 * Checks if the email is from a disposable/temporary domain
 * 
 * @param email The email address to check
 * @returns true if the email is from a blocked domain
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  
  // Extract the domain
  const domain = email.split('@')[1].toLowerCase();
  
  // Check against our list of blocked domains
  return BLOCKED_EMAIL_DOMAINS.includes(domain);
}

/**
 * Regular expression for validating email format (RFC 5322 compliant)
 * This is more strict than simple email validation to prevent common tricks
 */
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Validates email format using a stricter regex
 * 
 * @param email The email to validate
 * @returns true if the email is valid format
 */
export function isValidEmailFormat(email: string): boolean {
  return EMAIL_REGEX.test(String(email).toLowerCase());
}

/**
 * Checks if email local part is likely random/auto-generated
 * Many bots use random strings like "xkcd123@domain.com"
 * 
 * @param email The email address to check
 * @returns true if local part is suspicious
 */
export function isSuspiciousLocalPart(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  
  const localPart = email.split('@')[0].toLowerCase();
  
  // Check for excessive numbers (like abc123456)
  const numberCount = (localPart.match(/\d/g) || []).length;
  if (numberCount > 4 && numberCount / localPart.length > 0.4) return true;
  
  // Check for random strings with few vowels
  const vowelCount = (localPart.match(/[aeiou]/gi) || []).length;
  if (localPart.length > 6 && vowelCount / localPart.length < 0.2) return true;
  
  // Check for patterns like keyboard smashing
  const consecutiveConsonants = localPart.match(/[^aeiou]{5,}/gi);
  if (consecutiveConsonants && consecutiveConsonants.length > 0) return true;
  
  return false;
}

/**
 * Comprehensive email validation function that runs all checks
 * 
 * @param email The email address to validate
 * @returns ValidationResult with status and error message if failed
 */
export function validateEmail(email: string): { isValid: boolean; message?: string } {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }
  
  if (!isValidEmailFormat(email)) {
    return { isValid: false, message: "Invalid email format" };
  }
  
  if (isDisposableEmail(email)) {
    return { isValid: false, message: "Disposable email domains are not allowed" };
  }
  
  if (isSuspiciousLocalPart(email)) {
    return { isValid: false, message: "Email address appears to be auto-generated" };
  }
  
  return { isValid: true };
}
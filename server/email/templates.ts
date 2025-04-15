/**
 * Email templates for the application
 */

/**
 * Welcome email template sent to users after signup
 */
export const welcomeEmailTemplate = (username: string) => {
  return {
    subject: "Welcome to Sirened Beta",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #EFA738;">Welcome to BookVault Beta!</h2>
        <p>Hello ${username},</p>
        <p>Thank you for joining BookVault. We're excited to have you as part of our beta testing community!</p>
        <p>As a beta user, you'll have early access to all our features as we continue to develop and refine the platform.</p>
        <p>Here's what you can do now:</p>
        <ul>
          <li>Browse books from different genres</li>
          <li>Rate and review books you've read</li>
          <li>Follow your favorite authors</li>
          <li>Create wishlists and track your reading progress</li>
        </ul>
        <p>We value your feedback as we work to improve BookVault. If you encounter any issues or have suggestions, please don't hesitate to reach out to our support team.</p>
        <p>Happy reading!</p>
        <p>The BookVault Team</p>
        <div style="margin-top: 30px; font-size: 12px; color: #888;">
          <p>If you did not sign up for this service, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Welcome to BookVault Beta!
      
      Hello ${username},
      
      Thank you for joining BookVault. We're excited to have you as part of our beta testing community!
      
      As a beta user, you'll have early access to all our features as we continue to develop and refine the platform.
      
      Here's what you can do now:
      - Browse books from different genres
      - Rate and review books you've read
      - Follow your favorite authors
      - Create wishlists and track your reading progress
      
      We value your feedback as we work to improve BookVault. If you encounter any issues or have suggestions, please don't hesitate to reach out to our support team.
      
      Happy reading!
      
      The BookVault Team
      
      If you did not sign up for this service, please ignore this email.
    `
  };
};

/**
 * Signup interest email template for users who express interest in joining the platform
 */
export const signupInterestEmailTemplate = (email: string) => {
  return {
    subject: "Thanks for your interest in BookVault!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #EFA738;">Thank You for Your Interest!</h2>
        <p>Hello there,</p>
        <p>Thank you for your interest in BookVault – the digital platform for discovering and sharing books.</p>
        <p>We're currently in our beta testing phase, and we've added you to our waitlist. When spots become available, we'll send you a beta key so you can join our community of readers and authors.</p>
        <p>In the meantime, keep an eye on your inbox for updates on our progress and upcoming features.</p>
        <p>We can't wait to welcome you to BookVault!</p>
        <p>Best regards,</p>
        <p>The BookVault Team</p>
        <div style="margin-top: 30px; font-size: 12px; color: #888;">
          <p>You received this email because ${email} was used to sign up for BookVault updates. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Thank You for Your Interest!
      
      Hello there,
      
      Thank you for your interest in BookVault – the digital platform for discovering and sharing books.
      
      We're currently in our beta testing phase, and we've added you to our waitlist. When spots become available, we'll send you a beta key so you can join our community of readers and authors.
      
      In the meantime, keep an eye on your inbox for updates on our progress and upcoming features.
      
      We can't wait to welcome you to BookVault!
      
      Best regards,
      
      The BookVault Team
      
      You received this email because ${email} was used to sign up for BookVault updates. If you did not request this, please ignore this email.
    `
  };
};

/**
 * Beta key required email template for users who try to log in without a beta key
 */
export const betaKeyRequiredEmailTemplate = (email: string) => {
  return {
    subject: "BookVault Beta Access Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #EFA738;">BookVault Beta Access</h2>
        <p>Hello there,</p>
        <p>We noticed you recently tried to access BookVault, but you don't have beta access yet.</p>
        <p>BookVault is currently in a limited beta testing phase, and access is by invitation only. To join the platform, you'll need a valid beta key.</p>
        <p>If you've already signed up for our waitlist, rest assured that we'll send you a beta key as soon as spots become available.</p>
        <p>If you haven't signed up for the waitlist yet, you can do so on our website.</p>
        <p>Thank you for your interest in BookVault!</p>
        <p>Best regards,</p>
        <p>The BookVault Team</p>
        <div style="margin-top: 30px; font-size: 12px; color: #888;">
          <p>You received this email because ${email} was used to attempt access to BookVault. If you did not try to access our platform, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      BookVault Beta Access
      
      Hello there,
      
      We noticed you recently tried to access BookVault, but you don't have beta access yet.
      
      BookVault is currently in a limited beta testing phase, and access is by invitation only. To join the platform, you'll need a valid beta key.
      
      If you've already signed up for our waitlist, rest assured that we'll send you a beta key as soon as spots become available.
      
      If you haven't signed up for the waitlist yet, you can do so on our website.
      
      Thank you for your interest in BookVault!
      
      Best regards,
      
      The BookVault Team
      
      You received this email because ${email} was used to attempt access to BookVault. If you did not try to access our platform, please ignore this email.
    `
  };
};
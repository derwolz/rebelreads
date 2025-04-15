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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #102B3F; background-color: #F6F0FB; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #A06CD5; font-size: 24px; margin-bottom: 0;">Welcome to Sirened Beta!</h2>
        </div>
        <p>Hello ${username},</p>
        <p>Thank you for joining Sirened – where independent authors and readers connect directly. We're excited to have you as part of our beta testing community!</p>
        <p>As a beta user, you'll have early access to our revolutionary platform as we continue to develop and refine the experience.</p>
        <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0;">
          <p style="font-weight: bold; margin-top: 0;">Here's what you can do now:</p>
          <ul style="padding-left: 20px; margin-bottom: 0;">
            <li>Discover unique stories from independent authors</li>
            <li>Support authors directly with your purchases</li>
            <li>Follow your favorite storytellers</li>
            <li>Create wishlists and track your reading journey</li>
          </ul>
        </div>
        <p>We value your feedback as we work to transform indie publishing. If you encounter any issues or have suggestions, please don't hesitate to reach out to our support team.</p>
        <p>Happy reading!</p>
        <p>The Sirened Team</p>
        <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
          <p>If you did not sign up for this service, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Welcome to Sirened Beta!
      
      Hello ${username},
      
      Thank you for joining Sirened – where independent authors and readers connect directly. We're excited to have you as part of our beta testing community!
      
      As a beta user, you'll have early access to our revolutionary platform as we continue to develop and refine the experience.
      
      Here's what you can do now:
      - Discover unique stories from independent authors
      - Support authors directly with your purchases
      - Follow your favorite storytellers
      - Create wishlists and track your reading journey
      
      We value your feedback as we work to transform indie publishing. If you encounter any issues or have suggestions, please don't hesitate to reach out to our support team.
      
      Happy reading!
      
      The Sirened Team
      
      If you did not sign up for this service, please ignore this email.
    `
  };
};

/**
 * Signup interest email template for users who express interest in joining the platform
 */
export const signupInterestEmailTemplate = (email: string) => {
  return {
    subject: "Thanks for your interest in Sirened!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #102B3F; background-color: #F6F0FB; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #A06CD5; font-size: 24px; margin-bottom: 0;">Thank You for Your Interest!</h2>
        </div>
        <p>Hello there,</p>
        <p>Thank you for your interest in Sirened – the digital platform revolutionizing how independent authors connect directly with readers.</p>
        <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #EFA738; margin: 20px 0;">
          <p style="margin: 0;">We're currently in our beta testing phase, and we've added you to our waitlist. When spots become available, we'll send you a beta key so you can join our community of readers and independent authors.</p>
        </div>
        <p>At Sirened, we're creating a vibrant ecosystem where:</p>
        <ul style="padding-left: 20px; color: #102B3F;">
          <li>Authors keep 100% of their sales with no platform fees</li>
          <li>Readers discover books based on quality, not marketing budgets</li>
          <li>Direct author support creates meaningful connections</li>
        </ul>
        <p>In the meantime, keep an eye on your inbox for updates on our progress and upcoming features.</p>
        <p>We can't wait to welcome you to Sirened!</p>
        <p>Best regards,</p>
        <p>The Sirened Team</p>
        <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
          <p>You received this email because ${email} was used to sign up for Sirened updates. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Thank You for Your Interest!
      
      Hello there,
      
      Thank you for your interest in Sirened – the digital platform revolutionizing how independent authors connect directly with readers.
      
      We're currently in our beta testing phase, and we've added you to our waitlist. When spots become available, we'll send you a beta key so you can join our community of readers and independent authors.
      
      At Sirened, we're creating a vibrant ecosystem where:
      - Authors keep 100% of their sales with no platform fees
      - Readers discover books based on quality, not marketing budgets
      - Direct author support creates meaningful connections
      
      In the meantime, keep an eye on your inbox for updates on our progress and upcoming features.
      
      We can't wait to welcome you to Sirened!
      
      Best regards,
      
      The Sirened Team
      
      You received this email because ${email} was used to sign up for Sirened updates. If you did not request this, please ignore this email.
    `
  };
};

/**
 * Beta key required email template for users who try to log in without a beta key
 */
export const betaKeyRequiredEmailTemplate = (email: string) => {
  return {
    subject: "Sirened Beta Access Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #102B3F; background-color: #F6F0FB; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #A06CD5; font-size: 24px; margin-bottom: 0;">Sirened Beta Access</h2>
        </div>
        <p>Hello there,</p>
        <p>We noticed you recently tried to access Sirened, but you don't have beta access yet.</p>
        <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Sirened is currently in a limited beta testing phase, and access is by invitation only. To join our revolutionary indie publishing platform, you'll need a valid beta key.</p>
        </div>
        <p>If you've already signed up for our waitlist, rest assured that we'll send you a beta key as soon as spots become available.</p>
        <p>If you haven't signed up for the waitlist yet, you can do so on our website at <a href="https://sirened.com" style="color: #EFA738; text-decoration: none; font-weight: bold;">sirened.com</a>.</p>
        <p>We're creating a platform where:</p>
        <ul style="padding-left: 20px; color: #102B3F;">
          <li>Independent authors thrive</li>
          <li>Quality stories get the attention they deserve</li>
          <li>Readers connect directly with creators</li>
        </ul>
        <p>Thank you for your interest in Sirened!</p>
        <p>Best regards,</p>
        <p>The Sirened Team</p>
        <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
          <p>You received this email because ${email} was used to attempt access to Sirened. If you did not try to access our platform, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Sirened Beta Access
      
      Hello there,
      
      We noticed you recently tried to access Sirened, but you don't have beta access yet.
      
      Sirened is currently in a limited beta testing phase, and access is by invitation only. To join our revolutionary indie publishing platform, you'll need a valid beta key.
      
      If you've already signed up for our waitlist, rest assured that we'll send you a beta key as soon as spots become available.
      
      If you haven't signed up for the waitlist yet, you can do so on our website at sirened.com.
      
      We're creating a platform where:
      - Independent authors thrive
      - Quality stories get the attention they deserve
      - Readers connect directly with creators
      
      Thank you for your interest in Sirened!
      
      Best regards,
      
      The Sirened Team
      
      You received this email because ${email} was used to attempt access to Sirened. If you did not try to access our platform, please ignore this email.
    `
  };
};
/**
 * Email templates for the application
 */

/**
 * Email template for users who register without a beta key
 */
export const waitlistWelcomeEmailTemplate = (username: string) => {
  return {
    subject: "Welcome to Sirened Waitlist",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #102B3F; border-radius: 8px; overflow: hidden;">
        <!-- Header with logo -->
        <div style="text-align: center; background-color: #102B3F; padding: 30px 20px 15px 20px;">
          <!-- Sirened Logo PNG -->
          <img src="data:image/png;base64,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" alt="Sirened Logo" style="width: 200px; height: auto; margin-bottom: 10px;">
          <h2 style="color: #F6F0FB; font-size: 24px; margin-bottom: 0;">Thank You for Registering!</h2>
        </div>
        
        <!-- Content section -->
        <div style="padding: 25px; color: #F6F0FB;">
          <p>Hello ${username},</p>
          <p>Thank you for creating an account with Sirened – where independent authors and readers connect directly.</p>
          <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0;">
            <p style="font-weight: bold; margin-top: 0;">Your account has been created, but you need a beta key to access the platform.</p>
            <p style="margin-bottom: 0;">Sirened is currently in a limited beta testing phase. We've added you to our waitlist, and we'll send you a beta key as soon as spots become available.</p>
          </div>
          <p>At Sirened, we're creating a platform where:</p>
          <ul style="padding-left: 20px; color: #F6F0FB;">
            <li>Independent authors thrive</li>
            <li>Quality stories get the attention they deserve</li>
            <li>Readers connect directly with creators</li>
          </ul>
          <p>Keep an eye on your inbox - we'll notify you as soon as your beta key is ready!</p>
          <p>Thank you for your interest in Sirened!</p>
          <p>Best regards,</p>
          <p>The Sirened Team</p>
        </div>
        
        <!-- Footer section -->
        <div style="margin-top: 10px; font-size: 12px; color: #A06CD5; text-align: center; background-color: #0A1C2C; border-top: 1px solid #1E3C54; padding: 15px;">
          <p>If you did not sign up for this service, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Thank You for Registering!
      
      Hello ${username},
      
      Thank you for creating an account with Sirened – where independent authors and readers connect directly.
      
      Your account has been created, but you need a beta key to access the platform.
      
      Sirened is currently in a limited beta testing phase. We've added you to our waitlist, and we'll send you a beta key as soon as spots become available.
      
      At Sirened, we're creating a platform where:
      - Independent authors thrive
      - Quality stories get the attention they deserve
      - Readers connect directly with creators
      
      Keep an eye on your inbox - we'll notify you as soon as your beta key is ready!
      
      Thank you for your interest in Sirened!
      
      Best regards,
      
      The Sirened Team
      
      If you did not sign up for this service, please ignore this email.
    `
  };
};

/**
 * Welcome email template sent to users after signup
 */
export const welcomeEmailTemplate = (username: string) => {
  return {
    subject: "Welcome to Sirened Beta",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #102B3F; border-radius: 8px; overflow: hidden;">
        <!-- Header with logo -->
        <div style="text-align: center; background-color: #102B3F; padding: 30px 20px 15px 20px;">
          <!-- Sirened Logo PNG -->
          <img src="data:image/png;base64,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" alt="Sirened Logo" style="width: 200px; height: auto; margin-bottom: 10px;">
          <h2 style="color: #F6F0FB; font-size: 24px; margin-bottom: 0;">Welcome to Sirened Beta!</h2>
        </div>
        
        <!-- Content section -->
        <div style="padding: 25px; color: #F6F0FB;">
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
        </div>
        
        <!-- Footer section -->
        <div style="margin-top: 10px; font-size: 12px; color: #A06CD5; text-align: center; background-color: #0A1C2C; border-top: 1px solid #1E3C54; padding: 15px;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #102B3F; border-radius: 8px; overflow: hidden;">
        <!-- Header with logo -->
        <div style="text-align: center; background-color: #102B3F; padding: 30px 20px 15px 20px;">
          <!-- Sirened Logo PNG -->
          <img src="data:image/png;base64,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" alt="Sirened Logo" style="width: 200px; height: auto; margin-bottom: 10px;">
          <h2 style="color: #F6F0FB; font-size: 24px; margin-bottom: 0;">Thank You for Your Interest!</h2>
        </div>
        
        <!-- Content section -->
        <div style="padding: 25px; color: #F6F0FB;">
          <p>Hello there,</p>
          <p>Thank you for your interest in Sirened – the digital platform revolutionizing how independent authors connect directly with readers.</p>
          <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0;">
            <p style="margin: 0;">We're currently in our beta testing phase, and we've added you to our waitlist. When spots become available, we'll send you a beta key so you can join our community of readers and independent authors.</p>
          </div>
          <p>At Sirened, we're creating a vibrant ecosystem where:</p>
          <ul style="padding-left: 20px; color: #F6F0FB;">
            <li>Authors keep 100% of their sales with no platform fees</li>
            <li>Readers discover books based on quality, not marketing budgets</li>
            <li>Direct author support creates meaningful connections</li>
          </ul>
          <p>In the meantime, keep an eye on your inbox for updates on our progress and upcoming features.</p>
          <p>We can't wait to welcome you to Sirened!</p>
          <p>Best regards,</p>
          <p>The Sirened Team</p>
        </div>
        
        <!-- Footer section -->
        <div style="margin-top: 10px; font-size: 12px; color: #A06CD5; text-align: center; background-color: #0A1C2C; border-top: 1px solid #1E3C54; padding: 15px;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #102B3F; border-radius: 8px; overflow: hidden;">
        <!-- Header with logo -->
        <div style="text-align: center; background-color: #102B3F; padding: 30px 20px 15px 20px;">
          <!-- Sirened Logo PNG -->
          <img src="data:image/png;base64,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" alt="Sirened Logo" style="width: 200px; height: auto; margin-bottom: 10px;">
          <h2 style="color: #F6F0FB; font-size: 24px; margin-bottom: 0;">Sirened Beta Access</h2>
        </div>
        
        <!-- Content section -->
        <div style="padding: 25px; color: #F6F0FB;">
          <p>Hello there,</p>
          <p>We noticed you recently tried to access Sirened, but you don't have beta access yet.</p>
          <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Sirened is currently in a limited beta testing phase, and access is by invitation only. To join our revolutionary indie publishing platform, you'll need a valid beta key.</p>
          </div>
          <p>If you've already signed up for our waitlist, rest assured that we'll send you a beta key as soon as spots become available.</p>
          <p>If you haven't signed up for the waitlist yet, you can do so on our website at <a href="https://sirened.com" style="color: #EFA738; text-decoration: none; font-weight: bold;">sirened.com</a>.</p>
          <p>We're creating a platform where:</p>
          <ul style="padding-left: 20px; color: #F6F0FB;">
            <li>Independent authors thrive</li>
            <li>Quality stories get the attention they deserve</li>
            <li>Readers connect directly with creators</li>
          </ul>
          <p>Thank you for your interest in Sirened!</p>
          <p>Best regards,</p>
          <p>The Sirened Team</p>
        </div>
        
        <!-- Footer section -->
        <div style="margin-top: 10px; font-size: 12px; color: #A06CD5; text-align: center; background-color: #0A1C2C; border-top: 1px solid #1E3C54; padding: 15px;">
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
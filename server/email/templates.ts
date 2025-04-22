/**
 * Email templates for the application
 */

/**
 * Email verification template
 */
export const emailVerificationTemplate = (username: string, verificationCode: string) => {
  return {
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #102B3F; border-radius: 8px; overflow: hidden;">
        <!-- Header with logo -->
        <div style="text-align: center; background-color: #102B3F; padding: 30px 20px 15px 20px;">
          <h2 style="color: #F6F0FB; font-size: 24px; margin-bottom: 0;">Verify Your Email Address</h2>
        </div>
        
        <!-- Content section -->
        <div style="padding: 25px; color: #F6F0FB;">
          <p>Hello ${username},</p>
          <p>Please use the verification code below to verify your email address:</p>
          <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${verificationCode}
          </div>
          <p>This code will expire in 30 minutes. If you didn't request this verification, please ignore this email.</p>
          <p>Thank you,</p>
          <p>The Sirened Team</p>
        </div>
        
        <!-- Footer section -->
        <div style="margin-top: 10px; font-size: 12px; color: #A06CD5; text-align: center; background-color: #0A1C2C; border-top: 1px solid #1E3C54; padding: 15px;">
          <p>If you did not request this verification, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Verify Your Email Address
      
      Hello ${username},
      
      Please use the verification code below to verify your email address:
      
      ${verificationCode}
      
      This code will expire in 30 minutes. If you didn't request this verification, please ignore this email.
      
      Thank you,
      The Sirened Team
      
      If you did not request this verification, please ignore this email.
    `
  }
};

/**
 * Login verification template when detected from a new device/location
 */
export const loginVerificationTemplate = (username: string, verificationCode: string, ipAddress: string, userAgent: string) => {
  return {
    subject: "Verify Your Login Attempt",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #102B3F; border-radius: 8px; overflow: hidden;">
      <img src="https://sirened.com/api/storage/custom/sirenedlogo2-bQ788jFt.png" alt="Sirened Logo" style="width: 200px; height: auto; margin-bottom: 10px;">
        <div style="text-align: center; background-color: #102B3F; padding: 30px 20px 15px 20px;">
          <h2 style="color: #F6F0FB; font-size: 24px; margin-bottom: 0;">Verify Your Login Attempt</h2>
        </div>
        
        <div style="padding: 25px; color: #F6F0FB;">
          <p>Hello ${username},</p>
          <p>We detected a login attempt from a new location or device:</p>
          <div style="background-color: #183A56; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>IP Address:</strong> ${ipAddress}</p>
            <p><strong>Device:</strong> ${userAgent}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>To verify this was you, please use the following code when prompted:</p>
          <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${verificationCode}
          </div>
          <p>This code will expire in 15 minutes. If you didn't attempt to log in, please change your password immediately.</p>
          <p>Thank you,</p>
          <p>The Sirened Team</p>
        </div>
        
        <div style="margin-top: 10px; font-size: 12px; color: #A06CD5; text-align: center; background-color: #0A1C2C; border-top: 1px solid #1E3C54; padding: 15px;">
          <p>If you did not attempt to login, please secure your account immediately.</p>
        </div>
      </div>
    `,
    text: `
      Verify Your Login Attempt
      
      Hello ${username},
      
      We detected a login attempt from a new location or device:
      
      IP Address: ${ipAddress}
      Device: ${userAgent}
      Time: ${new Date().toLocaleString()}
      
      To verify this was you, please use the following code when prompted:
      
      ${verificationCode}
      
      This code will expire in 15 minutes. If you didn't attempt to log in, please change your password immediately.
      
      Thank you,
      The Sirened Team
      
      If you did not attempt to login, please secure your account immediately.
    `
  }
};

/**
 * Password reset email template
 */
export const passwordResetTemplate = (username: string, verificationCode: string) => {
  return {
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #102B3F; border-radius: 8px; overflow: hidden;">
      <img src="https://sirened.com/api/storage/custom/sirenedlogo2-bQ788jFt.png" alt="Sirened Logo" style="width: 200px; height: auto; margin-bottom: 10px;">
        <div style="text-align: center; background-color: #102B3F; padding: 30px 20px 15px 20px;">
          <h2 style="color: #F6F0FB; font-size: 24px; margin-bottom: 0;">Reset Your Password</h2>
        </div>
        
        <div style="padding: 25px; color: #F6F0FB;">
          <p>Hello ${username},</p>
          <p>We received a request to reset your password. Please use the verification code below:</p>
          <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${verificationCode}
          </div>
          <p>This code will expire in 30 minutes. If you didn't request a password reset, please ignore this email.</p>
          <p>Thank you,</p>
          <p>The Sirened Team</p>
        </div>
        
        <div style="margin-top: 10px; font-size: 12px; color: #A06CD5; text-align: center; background-color: #0A1C2C; border-top: 1px solid #1E3C54; padding: 15px;">
          <p>If you did not request this password reset, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `
      Reset Your Password
      
      Hello ${username},
      
      We received a request to reset your password. Please use the verification code below:
      
      ${verificationCode}
      
      This code will expire in 30 minutes. If you didn't request a password reset, please ignore this email.
      
      Thank you,
      The Sirened Team
      
      If you did not request this password reset, please ignore this email.
    `
  }
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
          <img src="https://sirened.com/api/storage/custom/sirenedlogo2-bQ788jFt.png" alt="Sirened Logo" style="width: 200px; height: auto; margin-bottom: 10px;">
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
          <img src="https://sirened.com/api/storage/custom/sirenedlogo2-bQ788jFt.png" alt="Sirened Logo" style="width: 200px; height: auto; margin-bottom: 10px;">
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
 * Beta invitation email template with beta key for users invited to join the beta
 */
export const betaInvitationEmailTemplate = (email: string, betaKey: string) => {
  return {
    subject: "Your Sirened Beta Access Is Ready!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #102B3F; border-radius: 8px; overflow: hidden;">
        <!-- Header with logo -->
        <div style="text-align: center; background-color: #102B3F; padding: 30px 20px 15px 20px;">
          <!-- Sirened Logo PNG -->
          <img src="https://sirened.com/api/storage/custom/sirenedlogo2-bQ788jFt.png" alt="Sirened Logo" style="width: 200px; height: auto; margin-bottom: 10px;">
          <h2 style="color: white; font-size: 24px; margin-bottom: 0;">Welcome to Sirened Beta!</h2>
        </div>
        
        <!-- Content section -->
        <div style="padding: 25px; color: white;">
          <p>Hello there,</p>
          <p>Great news! We're excited to invite you to join the Sirened beta program. As one of our select early users, you'll help shape the future of a platform created specifically for independent authors and readers.</p>
          <div style="background-color: #A06CD5; padding: 15px; border-radius: 8px; color: white; margin: 20px 0; text-align: center;">
            <p style="font-weight: bold; margin-top: 0; font-size: 16px;">Your exclusive beta key:</p>
            <p style="font-size: 24px; letter-spacing: 1px; font-family: monospace; background-color: #183A56; padding: 10px; border-radius: 5px; margin: 10px 0;">${betaKey}</p>
            <p style="margin-bottom: 0; font-size: 14px;">Use this key when signing in to access your account</p>
          </div>
          <p>At Sirened, we're building a community where:</p>
          <ul style="padding-left: 20px; color: white;">
            <li>Readers can discover exceptional independent books</li>
            <li>Authors maintain complete control over their work</li>
            <li>Direct connections foster a vibrant literary ecosystem</li>
          </ul>
          <p>Ready to get started? Just follow these steps:</p>
          <ol style="padding-left: 20px; color: white;">
            <li>Visit <a href="https://sirened.com/auth" style="color: #A06CD5;">sirened.com/auth</a></li>
            <li>Sign in with your account</li>
            <li>When prompted, enter your beta key</li>
            <li>Start exploring and sharing your feedback</li>
          </ol>
          <p>Your insights during this beta period are invaluable to us. We can't wait to hear what you think!</p>
          <p>Happy reading,</p>
          <p>The Sirened Team</p>
        </div>
        
        <!-- Footer section -->
        <div style="margin-top: 10px; font-size: 12px; color: #A06CD5; text-align: center; background-color: #0A1C2C; border-top: 1px solid #1E3C54; padding: 15px;">
          <p>You received this email because ${email} was used to sign up for Sirened updates. This beta key is exclusive to you and should not be shared.</p>
        </div>
      </div>
    `,
    text: `
      Welcome to Sirened Beta!
      
      Hello there,
      
      Great news! We're excited to invite you to join the Sirened beta program. As one of our select early users, you'll help shape the future of a platform created specifically for independent authors and readers.
      
      Your exclusive beta key: ${betaKey}
      
      Use this key when signing in to access your account.
      
      At Sirened, we're building a community where:
      - Readers can discover exceptional independent books
      - Authors maintain complete control over their work
      - Direct connections foster a vibrant literary ecosystem
      
      Ready to get started? Just follow these steps:
      1. Visit sirened.com/auth
      2. Sign in with your account
      3. When prompted, enter your beta key
      4. Start exploring and sharing your feedback
      
      Your insights during this beta period are invaluable to us. We can't wait to hear what you think!
      
      Happy reading,
      The Sirened Team
      
      You received this email because ${email} was used to sign up for Sirened updates. This beta key is exclusive to you and should not be shared.
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
         <img src="https://sirened.com/api/storage/custom/sirenedlogo2-bQ788jFt.png" alt="Sirened Logo" style="width: 200px; height: auto; margin-bottom: 10px;">
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
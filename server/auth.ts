import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { dbStorage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {
      isAuthor?: boolean;
      isPro?: boolean;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: dbStorage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email', // This will accept either email or username
    }, async (emailOrUsername, password, done) => {
      // Try to find user by email first
      let user = await dbStorage.getUserByEmail(emailOrUsername);

      // If not found by email, try username
      if (!user) {
        user = await dbStorage.getUserByUsername(emailOrUsername);
      }

      if (!user || !(await comparePasswords(password, user.password!))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  // Configure Google OAuth strategy
  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `/api/auth/google/callback`,
      scope: ["profile", "email"],
      // Add these properties to make Google OAuth more permissive for development
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      proxy: true,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        const providerId = profile.id;
        let user = await dbStorage.getUserByProviderId("google", providerId);
        
        if (user) {
          // User exists, return the user
          return done(null, user);
        }

        // User doesn't exist, check if their email is already registered
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        // Check if user exists with this email
        user = await dbStorage.getUserByEmail(email);
        
        if (user) {
          // Email exists but not linked to Google, update user with Google provider details
          user = await dbStorage.updateUser(user.id, {
            provider: "google",
            providerId: providerId,
            // Update profile image if available
            profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
          });
          return done(null, user);
        }

        // Create a new user with Google profile information
        // Generate a username based on the profile name
        let username = profile.displayName.toLowerCase().replace(/\s+/g, '');
        
        // Check if username exists
        const usernameExists = await dbStorage.getUserByUsername(username);
        if (usernameExists) {
          // Append a random number to make the username unique
          username = `${username}${Math.floor(Math.random() * 10000)}`;
        }

        // Create the user
        const newUser = await dbStorage.createUser({
          email,
          username,
          password: null as unknown as string, // No password for OAuth users
          newsletterOptIn: false,
          provider: "google",
          providerId,
          // Set profile image separately after user creation if needed
        });

        return done(null, newUser);
      } catch (err) {
        return done(err as Error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    // Get basic user info
    const user = await dbStorage.getUser(id);
    
    if (user) {
      // Check if user is an author
      const isAuthor = await dbStorage.isUserAuthor(user.id);
      
      // If user is an author, get author details
      if (isAuthor) {
        const authorDetails = await dbStorage.getAuthorByUserId(user.id);
        
        // Ensure user session has isPro and isAuthor flags
        // Pro status is tracked in the user table, not in authors table anymore
        const userWithAuthorInfo = {
          ...user,
          isAuthor, // Add isAuthor flag
          isPro: user.is_pro || false // Set isPro based on user's is_pro property
        };
        
        done(null, userWithAuthorInfo);
      } else {
        // Regular user
        done(null, {
          ...user,
          isAuthor: false,
          isPro: user.is_pro || false // Set isPro based on user's is_pro property even for non-authors
        });
      }
    } else {
      done(null, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if beta is active
      const isBetaActive = await dbStorage.isBetaActive();
      
      // Get the beta key if provided
      const { betaKey } = req.body;
      
      // Variables to track beta access status
      let userHasBetaAccess = false;
      let validBetaKeyProvided = false;
      
      // If beta is active and a key is provided, validate it
      if (isBetaActive && betaKey) {
        const isValidKey = await dbStorage.validateBetaKey(betaKey);
        if (isValidKey) {
          validBetaKeyProvided = true;
          userHasBetaAccess = true;
        } else {
          // Only return an error if they provided an invalid key
          return res.status(400).json({ error: "Invalid beta key" });
        }
      }
      
      // Check for existing email
      const existingEmail = await dbStorage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }

      // Check for existing username
      const existingUsername = await dbStorage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).send("Username already exists");
      }

      // Create the user 
      const user = await dbStorage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      
      // If beta is active and registration was successful and user provided a valid beta key, record it
      if (isBetaActive && validBetaKeyProvided) {
        const betaKeyObj = await dbStorage.getBetaKeyByKey(betaKey);
        if (betaKeyObj) {
          await dbStorage.recordBetaKeyUsage(betaKeyObj.id, user.id);
        }
      }
      
      // Send welcome email
      try {
        // Import the email service dynamically to avoid circular dependencies
        const { emailService } = await import("./email");
        
        // Send welcome email
        await emailService.sendWelcomeEmail(user.email, user.username);
        console.log(`Welcome email sent to ${user.email}`);
      } catch (emailError) {
        // Log but don't fail if email sending fails
        console.warn("Could not send welcome email:", emailError);
      }

      // Check if the user has used a beta key previously (different than the one just provided)
      if (!userHasBetaAccess) {
        const hasUsedBetaKey = await dbStorage.hasUserUsedBetaKey(user.id);
        if (hasUsedBetaKey) {
          userHasBetaAccess = true;
        }
      }
      
      // Login the user with the appropriate access level
      req.login(user, (err) => {
        if (err) return next(err);
        
        if (isBetaActive && !userHasBetaAccess) {
          // User registered without beta access during beta phase - use 403 status code
          // This still creates the account but signals to the frontend that beta access is required
          return res.status(403).json({
            message: "Thank you for your interest in Sirened! Your account has been created. We'll notify you when beta access is available for your account."
          });
        } else {
          // Normal registration with beta access or beta is not active
          res.status(201).json(user);
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      // Proceed with passport authentication first to get the user
      passport.authenticate("local", async (err: any, user: SelectUser | false, info: any) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ error: "Invalid email/username or password" });
        }

        // Check if beta is active
        const isBetaActive = await dbStorage.isBetaActive();
        
        // If beta is active, check if the user has beta access
        if (isBetaActive) {
          // Check if the user has used a beta key before
          const hasUsedBetaKey = await dbStorage.hasUserUsedBetaKey(user.id);

          // If they haven't used a beta key before, check if they provided one with this login attempt
          if (!hasUsedBetaKey) {
            const { betaKey } = req.body;
            
            if (betaKey) {
              // They provided a beta key, let's validate it
              const isValidKey = await dbStorage.validateBetaKey(betaKey);
              
              if (!isValidKey) {
                return res.status(400).json({ error: "Invalid beta key" });
              }
              
              // Record the beta key usage
              const betaKeyObj = await dbStorage.getBetaKeyByKey(betaKey);
              if (betaKeyObj) {
                await dbStorage.recordBetaKeyUsage(betaKeyObj.id, user.id);
              }
            } else {
              // User doesn't have beta access - still login but use 403 Forbidden status
              // to indicate they don't have beta access yet
              req.login(user, (err) => {
                if (err) {
                  return next(err);
                }
                return res.status(403).json({
                  message: "Thank you for your interest in Sirened! We'll notify you when beta access is available for your account."
                });
              });
              return; // Return early to prevent the regular login flow
            }
          }
          // If they have used a beta key before, no need to validate again, just log them in normally
        }
        
        // Login the user
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.status(200).json(user);
        });
      })(req, res, next);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Google OAuth routes
  app.get("/api/auth/google", (req, res, next) => {
    console.log("Google auth endpoint called, session ID:", req.session.id);
    
    // Store beta key in session if provided
    const { google_auth_beta_key } = req.session as any;
    console.log("google_auth_beta_key:", google_auth_beta_key);
    
    // Check for pending beta key that would have been set by the store-beta-key endpoint
    console.log("Checking for pending_beta_key:", (req.session as any).pending_beta_key);
    
    // If beta key is in the session, store it for use in the callback
    if (google_auth_beta_key) {
      console.log("Found google_auth_beta_key, setting pending_beta_key");
      (req.session as any).pending_beta_key = google_auth_beta_key;
      // Clear the temporary key
      delete (req.session as any).google_auth_beta_key;
      console.log("Cleared google_auth_beta_key, new pending_beta_key:", (req.session as any).pending_beta_key);
    }
    
    // Save the session to make sure our beta key is persisted
    req.session.save(err => {
      if (err) {
        console.error("Error saving session:", err);
      } else {
        console.log("Session saved before Google auth redirect");
      }
      
      passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
    });
  });

  // New endpoint to verify a beta key from the client-side localStorage
  // The client will call this after a successful Google login if they have a beta key stored locally
  app.post("/api/auth/verify-local-beta-key", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }
      
      console.log("Local beta key verification for user:", req.user?.id);
      const { betaKey } = req.body;
      
      if (!betaKey) {
        return res.status(400).json({ success: false, message: "No beta key provided" });
      }
      
      console.log("Verifying local beta key:", betaKey);
      
      // Check if the user already has beta access
      const hasUsedBetaKey = await dbStorage.hasUserUsedBetaKey(req.user!.id);
      
      if (hasUsedBetaKey) {
        console.log("User already has beta access, no need to verify the key");
        return res.status(200).json({ success: true, message: "User already has beta access" });
      }
      
      // Validate the key
      const isValidKey = await dbStorage.validateBetaKey(betaKey);
      console.log("Beta key valid:", isValidKey);
      
      if (!isValidKey) {
        return res.status(400).json({ success: false, message: "Invalid beta key" });
      }
      
      // Record the beta key usage
      const betaKeyObj = await dbStorage.getBetaKeyByKey(betaKey);
      if (!betaKeyObj) {
        return res.status(400).json({ success: false, message: "Beta key not found" });
      }
      
      console.log("Recording beta key usage for key:", betaKeyObj.id, "and user:", req.user!.id);
      await dbStorage.recordBetaKeyUsage(betaKeyObj.id, req.user!.id);
      
      return res.status(200).json({ success: true, message: "Beta key accepted" });
    } catch (error) {
      console.error("Error verifying local beta key:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    async (req, res) => {
      try {
        console.log("Google auth callback received, user:", req.user?.id);
        console.log("Session ID:", req.session.id);
        
        // Check if beta is active
        const isBetaActive = await dbStorage.isBetaActive();
        console.log("Beta active:", isBetaActive);
        
        // Variable to track if we need to verify a local beta key after redirect
        let shouldVerifyLocalKey = false;
        
        if (isBetaActive && req.user) {
          // First check if the user already has a beta key tied to their account
          let hasUsedBetaKey = await dbStorage.hasUserUsedBetaKey(req.user.id);
          console.log("User has previously used beta key:", hasUsedBetaKey);
          
          // If they don't already have a key, check if they provided one with this login
          if (!hasUsedBetaKey) {
            // First try to get the beta key from pending_beta_key, then fall back to google_auth_beta_key
            let pendingBetaKey = (req.session as any).pending_beta_key || '';
            
            if (!pendingBetaKey && (req.session as any).google_auth_beta_key) {
              pendingBetaKey = (req.session as any).google_auth_beta_key;
              console.log("No pending_beta_key found, using google_auth_beta_key instead:", pendingBetaKey);
            }
            
            console.log("Pending beta key from session:", pendingBetaKey);
            
            // If they provided a key with this login, validate and record it
            if (pendingBetaKey) {
              // Even though we already validated in the store endpoint, validate again to be sure
              const isValidKey = await dbStorage.validateBetaKey(pendingBetaKey);
              console.log("Beta key valid:", isValidKey);
              
              if (isValidKey) {
                // Record the beta key usage
                const betaKeyObj = await dbStorage.getBetaKeyByKey(pendingBetaKey);
                console.log("Found beta key object:", betaKeyObj?.id);
                
                if (betaKeyObj) {
                  try {
                    console.log("Recording beta key usage for key:", betaKeyObj.id, "and user:", req.user.id);
                    const betaKeyUsage = await dbStorage.recordBetaKeyUsage(betaKeyObj.id, req.user.id);
                    console.log("Beta key usage recorded:", betaKeyUsage);
                    hasUsedBetaKey = true;
                  } catch (dbError) {
                    console.error("Error recording beta key usage:", dbError);
                    // Try to recover if possible - check if record exists despite error
                    hasUsedBetaKey = await dbStorage.hasUserUsedBetaKey(req.user.id);
                    console.log("Double-checking if user has beta key after error:", hasUsedBetaKey);
                  }
                } else {
                  console.log("Failed to find beta key object for key:", pendingBetaKey);
                }
              }
              
              // Clear the pending beta keys from session regardless of outcome
              delete (req.session as any).pending_beta_key;
              delete (req.session as any).google_auth_beta_key;
              console.log("Cleared pending beta keys from session");
            } else {
              console.log("No pending beta key found in session");
              // We'll need to check localStorage for a beta key after redirect
              shouldVerifyLocalKey = true;
            }
            
            // If they still don't have a valid beta key and we don't need to check localStorage,
            // log them out and redirect to landing page
            if (!hasUsedBetaKey && !shouldVerifyLocalKey) {
              console.log("User still doesn't have a valid beta key, logging out");
              req.logout(() => {
                return res.redirect("/landing");
              });
              return;
            }
          }
        }
        
        // Successful authentication, redirect to appropriate page
        console.log("Authentication successful, user is author:", req.user?.isAuthor);
        
        // For beta users, we'll redirect to a special page that will check localStorage
        if (isBetaActive && shouldVerifyLocalKey) {
          res.redirect("/auth-check");
        } else if (req.user?.isAuthor) {
          res.redirect("/pro");
        } else {
          res.redirect("/");
        }
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        res.redirect("/landing");
      }
    }
  );
  
  // Endpoint to store beta key in session before Google OAuth redirect
  app.post("/api/auth/google/store-beta-key", async (req, res) => {
    try {
      console.log("Store beta key endpoint called");
      const { betaKey } = req.body;
      console.log("Received beta key:", betaKey);
      
      // This is a critical endpoint where we validate and prepare for the Google OAuth flow
      let validatedBetaKey = null;
      
      // Beta key is optional now, but if provided, validate it
      if (betaKey) {
        console.log("Validating beta key");
        const isValid = await dbStorage.validateBetaKey(betaKey);
        console.log("Beta key validation result:", isValid);
        
        if (!isValid) {
          console.log("Invalid beta key, returning 400");
          return res.status(400).json({ error: "Invalid beta key" });
        }
        
        // If it's valid, store the validated key
        validatedBetaKey = betaKey;
        
        // Get the beta key object for reference
        const betaKeyObj = await dbStorage.getBetaKeyByKey(betaKey);
        console.log("Beta key object found:", betaKeyObj?.id);
      }
      
      // Store both in the session to increase redundancy
      (req.session as any).pending_beta_key = validatedBetaKey || "";
      (req.session as any).google_auth_beta_key = validatedBetaKey || "";
      
      console.log("Stored beta key in session:", (req.session as any).pending_beta_key);
      console.log("Also stored as google_auth_beta_key:", (req.session as any).google_auth_beta_key);
      console.log("Session ID:", req.session.id);
      
      // Save the session explicitly to ensure it's persisted
      req.session.save(err => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        console.log("Session saved successfully with beta key");
        res.status(200).json({ success: true });
      });
    } catch (error) {
      console.error("Error storing beta key:", error);
      res.status(500).json({ error: "Failed to store beta key" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });
  
  // Add middleware to ensure API routes always return JSON for unauthenticated requests
  app.use((req, res, next) => {
    // For API routes, ensure proper error response for unauthenticated requests
    if (req.path.startsWith('/api/') && 
        !req.isAuthenticated() && 
        !req.path.startsWith('/api/auth/') && 
        !req.path.startsWith('/api/beta/') &&
        !req.path.startsWith('/api/popular-books') && // Allow unauthenticated access to popular books
        !req.path.startsWith('/api/landing/') && // Allow unauthenticated access to landing page
        !req.path.startsWith('/api/signup-interest') && // Allow unauthenticated signup interest
        !req.path.startsWith('/api/debug/') && // Allow unauthenticated access to debug endpoints
        !req.path.match(/^\/api\/books(\/\d+)?(\/ratings|\/reading-status|\/taxonomies)?$/) && 
        !req.path.match(/^\/api\/genres.*$/) && // Allow unauthenticated access to genres for the landing page
        req.method !== 'OPTIONS') {
      // Set content type explicitly to prevent HTML responses
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    next();
  });
}
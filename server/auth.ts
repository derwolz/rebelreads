import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
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
          isPro: false
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

      let hasBetaAccess = !isBetaActive; // automatically true if beta is not active
      
      // If beta is active, check if they provided a valid beta key
      if (isBetaActive) {
        const { betaKey } = req.body;
        
        if (betaKey) {
          const isValidKey = await dbStorage.validateBetaKey(betaKey);
          if (isValidKey) {
            hasBetaAccess = true;
          }
        }
      }
      
      // Create the user account
      const user = await dbStorage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        hasBetaAccess: hasBetaAccess,
      });
      
      // If beta is active and registration was successful with a valid beta key, record the usage
      if (isBetaActive && hasBetaAccess && req.body.betaKey) {
        const betaKeyObj = await dbStorage.getBetaKeyByKey(req.body.betaKey);
        if (betaKeyObj) {
          await dbStorage.recordBetaKeyUsage(betaKeyObj.id, user.id);
        }
      }
      
      // Send appropriate email based on beta access
      try {
        // Import the email service dynamically to avoid circular dependencies
        const { emailService } = await import("./email");
        
        if (hasBetaAccess) {
          // Send welcome email for users with beta access
          await emailService.sendWelcomeEmail(user.email, user.username);
          console.log(`Welcome email sent to ${user.email}`);
        } else {
          // Send waitlist welcome email for users without beta access
          await emailService.sendWaitlistWelcomeEmail(user.email, user.username);
          console.log(`Waitlist welcome email sent to ${user.email}`);
        }
      } catch (emailError) {
        // Log but don't fail if email sending fails
        console.warn("Could not send email:", emailError);
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
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
        
        // If beta is active and the user is not authenticated, we need to check beta access
        if (isBetaActive && !req.isAuthenticated()) {
          // First check if the user already has beta access in their account
          if (!user.hasBetaAccess) {
            // Check if they're providing a beta key with this login attempt
            const { betaKey } = req.body;
            
            if (!betaKey) {
              // Send beta key required email
              try {
                // Import the email service dynamically to avoid circular dependencies
                const { emailService } = await import("./email");
                
                // Send beta key required email
                await emailService.sendBetaKeyRequiredEmail(user.email);
                console.log(`Beta key required email sent to ${user.email}`);
              } catch (emailError) {
                // Log but don't fail if email sending fails
                console.warn("Could not send beta key required email:", emailError);
              }
              
              return res.status(400).json({ error: "Beta key is required during beta testing phase" });
            }
            
            // Validate the beta key they provided
            const isValidKey = await dbStorage.validateBetaKey(betaKey);
            
            if (!isValidKey) {
              return res.status(400).json({ error: "Invalid beta key" });
            }
            
            // Record the beta key usage
            const betaKeyObj = await dbStorage.getBetaKeyByKey(betaKey);
            if (betaKeyObj) {
              await dbStorage.recordBetaKeyUsage(betaKeyObj.id, user.id);
              
              // Update the user's hasBetaAccess status
              await dbStorage.updateUserBetaAccess(user.id, true);
              user.hasBetaAccess = true;
            }
          }
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
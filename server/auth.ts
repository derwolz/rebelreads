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
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
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
    const user = await dbStorage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if beta is active
      const isBetaActive = await dbStorage.isBetaActive();
      
      // If beta is active, validate the beta key
      if (isBetaActive) {
        const { betaKey } = req.body;
        
        if (!betaKey) {
          return res.status(400).json({ error: "Beta key is required during beta testing phase" });
        }
        
        const isValidKey = await dbStorage.validateBetaKey(betaKey);
        
        if (!isValidKey) {
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

      const user = await dbStorage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      
      // If beta is active and registration was successful, record the beta key usage
      if (isBetaActive && req.body.betaKey) {
        const betaKeyObj = await dbStorage.getBetaKeyByKey(req.body.betaKey);
        if (betaKeyObj) {
          await dbStorage.recordBetaKeyUsage(betaKeyObj.id, user.id);
        }
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
      // Check if beta is active
      const isBetaActive = await dbStorage.isBetaActive();
      
      // If beta is active, validate the beta key
      if (isBetaActive && !req.isAuthenticated()) {
        const { betaKey } = req.body;
        
        if (!betaKey) {
          return res.status(400).json({ error: "Beta key is required during beta testing phase" });
        }
        
        const isValidKey = await dbStorage.validateBetaKey(betaKey);
        
        if (!isValidKey) {
          return res.status(400).json({ error: "Invalid beta key" });
        }
      }
      
      // Proceed with passport authentication
      passport.authenticate("local", async (err: any, user: SelectUser | false, info: any) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ error: "Invalid email/username or password" });
        }
        
        // If beta is active, record the beta key usage
        if (isBetaActive && req.body.betaKey) {
          const betaKeyObj = await dbStorage.getBetaKeyByKey(req.body.betaKey);
          if (betaKeyObj) {
            await dbStorage.recordBetaKeyUsage(betaKeyObj.id, user.id);
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
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
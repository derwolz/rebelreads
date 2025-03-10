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
      isAdmin: boolean;
    }
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
      console.log("Login attempt:", { emailOrUsername });

      // Try to find user by email first
      let user = await dbStorage.getUserByEmail(emailOrUsername);

      // If not found by email, try username
      if (!user) {
        user = await dbStorage.getUserByUsername(emailOrUsername);
      }

      if (!user || !(await comparePasswords(password, user.password!))) {
        console.log("Login failed: Invalid credentials");
        return done(null, false);
      } else {
        // Add isAdmin flag based on email match
        const isAdmin = user.email === process.env.ADMIN_EMAIL;
        console.log("Login successful:", { 
          userId: user.id,
          email: user.email,
          isAdmin
        });
        return done(null, { ...user, isAdmin });
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await dbStorage.getUser(id);
    if (user) {
      // Add isAdmin flag during deserialization as well
      const isAdmin = user.email === process.env.ADMIN_EMAIL;
      console.log("Deserializing user:", {
        userId: user.id,
        email: user.email,
        isAdmin,
      });
      done(null, { ...user, isAdmin });
    } else {
      done(new Error('User not found'));
    }
  });

  app.post("/api/register", async (req, res, next) => {
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

    // Add isAdmin flag for the response
    const isAdmin = user.email === process.env.ADMIN_EMAIL;
    console.log("User registered:", {
      userId: user.id,
      email: user.email,
      isAdmin
    });

    req.login({ ...user, isAdmin }, (err) => {
      if (err) return next(err);
      res.status(201).json({ ...user, isAdmin });
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log("Login response:", { user: req.user });
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log("Current user:", { user: req.user });
    res.json(req.user);
  });
}
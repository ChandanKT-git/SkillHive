import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import cors from "cors";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for all routes
  app.use(cors({ origin: true, credentials: true }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get user profile endpoint
  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      next(error);
    }
  });

  // Get user by username endpoint
  app.get("/api/users/username/:username", async (req, res, next) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      next(error);
    }
  });

  // Create new user endpoint
  app.post("/api/users", async (req, res, next) => {
    try {
      const { username, password, displayName, email, role } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        password, // In production, this should be hashed!
        displayName,
        email,
        role
      });
      
      // Don't return password
      const { password: _, ...userProfile } = newUser;
      res.status(201).json(userProfile);
    } catch (error) {
      next(error);
    }
  });

  // Skills endpoints would go here
  // Sessions endpoints would go here
  // Reviews endpoints would go here
  // Bookmarks endpoints would go here

  const httpServer = createServer(app);

  return httpServer;
}


import { createServer } from "http";
import { storage } from "./storage";
import cors from "cors";

export async function registerRoutes(app) {
  app.use(cors({ origin: true, credentials: true }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/username/:username", async (req, res, next) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", async (req, res, next) => {
    try {
      const { username, password, displayName, email, role } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }
      
      const newUser = await storage.createUser({
        username,
        password,
        displayName,
        email,
        role
      });
      
      const { password: _, ...userProfile } = newUser;
      res.status(201).json(userProfile);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/skills", async (req, res, next) => {
    try {
      const skills = await storage.getSkillPosts();
      res.json(skills);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/skills/:id", async (req, res, next) => {
    try {
      const skillId = parseInt(req.params.id);
      const skill = await storage.getSkillPostById(skillId);
      
      if (!skill) {
        return res.status(404).json({ message: "Skill post not found" });
      }
      
      res.json(skill);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/skills", async (req, res, next) => {
    try {
      const skillPost = req.body;
      const newSkill = await storage.createSkillPost(skillPost);
      res.status(201).json(newSkill);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

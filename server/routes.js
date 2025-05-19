const { createServer } = require("http");
const { storage } = require("./storage");
const cors = require("cors");

async function registerRoutes(app) {
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

  // Skills endpoints
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

  // Sessions endpoints would go here
  // Reviews endpoints would go here
  // Bookmarks endpoints would go here

  const httpServer = createServer(app);

  return httpServer;
}

module.exports = { registerRoutes };
// Import schemas from shared schema
import { users, skillPosts } from "../shared/schema";

// Storage interface for database operations
export class MemStorage {
  constructor() {
    this.users = new Map();
    this.skillPosts = new Map();
    this.currentUserId = 1;
    this.currentSkillId = 1;
  }

  // User methods
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Skill posts methods
  async getSkillPosts() {
    return Array.from(this.skillPosts.values());
  }

  async getSkillPostById(id) {
    return this.skillPosts.get(id);
  }

  async createSkillPost(insertSkillPost) {
    const id = this.currentSkillId++;
    const skillPost = { 
      ...insertSkillPost, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.skillPosts.set(id, skillPost);
    
    // Add some sample skill data for testing
    if (this.skillPosts.size === 1) {
      this.addSampleSkillPosts();
    }
    
    return skillPost;
  }
  
  // Helper to add sample skill post data
  addSampleSkillPosts() {
    const sampleSkills = [
      {
        id: this.currentSkillId++,
        mentorId: 1,
        title: "Web Development with React",
        description: "Learn modern React development including hooks, context API, and building responsive UIs.",
        tags: ["Programming", "Web Development", "React"],
        experienceLevel: "Intermediate",
        sessionLength: 60,
        price: 25,
        rating: 4.8,
        reviewCount: 24,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentSkillId++,
        mentorId: 2,
        title: "Data Visualization with D3.js",
        description: "Master creating interactive data visualizations for the web using D3.js.",
        tags: ["Programming", "Data Science", "Visualization"],
        experienceLevel: "Advanced",
        sessionLength: 90,
        price: 35,
        rating: 4.9,
        reviewCount: 18,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentSkillId++,
        mentorId: 3,
        title: "Digital Photography Basics",
        description: "Learn composition, lighting, and editing techniques for stunning photos.",
        tags: ["Photography", "Creative", "Digital"],
        experienceLevel: "Beginner",
        sessionLength: 45,
        price: 20,
        rating: 4.7,
        reviewCount: 31,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentSkillId++,
        mentorId: 1,
        title: "Mobile App Design Principles",
        description: "Learn UI/UX design specifically for mobile applications and responsive interfaces.",
        tags: ["Design", "UI/UX", "Mobile"],
        experienceLevel: "Intermediate",
        sessionLength: 60,
        price: 30,
        rating: 4.6,
        reviewCount: 15,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentSkillId++,
        mentorId: 2,
        title: "Financial Planning Basics",
        description: "Learn to budget, save, and plan for your financial future with practical strategies.",
        tags: ["Finance", "Personal", "Planning"],
        experienceLevel: "Beginner",
        sessionLength: 60,
        price: 25,
        rating: 4.9,
        reviewCount: 27,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    sampleSkills.forEach(skill => {
      this.skillPosts.set(skill.id, skill);
    });
  }
}

// Export a singleton instance
export const storage = new MemStorage();
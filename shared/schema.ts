import { pgTable, text, serial, integer, boolean, timestamp, json, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email").notNull().unique(),
  photoURL: text("photo_url"),
  role: text("role").default("learner").notNull(), // 'learner', 'mentor', 'both', 'admin'
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  github: text("github"),
  linkedin: text("linkedin"),
  expertise: text("expertise").array(), // Array of skills/expertise areas
  xp: integer("xp").default(0),
  sessionsCompleted: integer("sessions_completed").default(0),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Skill post model
export const skillPosts = pgTable("skill_posts", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tags: text("tags").array(),
  imageUrl: text("image_url"),
  experienceLevel: text("experience_level"),
  sessionLength: integer("session_length").default(60), // in minutes
  availability: json("availability"), // Store availability as JSON
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Session model
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  skillPostId: integer("skill_post_id").references(() => skillPosts.id),
  mentorId: integer("mentor_id").notNull().references(() => users.id),
  learnerId: integer("learner_id").notNull().references(() => users.id),
  message: text("message"),
  status: text("status").default("pending").notNull(), // 'pending', 'confirmed', 'completed', 'cancelled'
  scheduledDate: timestamp("scheduled_date"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  jitsiLink: text("jitsi_link"),
  reviewed: boolean("reviewed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Review model
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  skillPostId: integer("skill_post_id").references(() => skillPosts.id),
  mentorId: integer("mentor_id").notNull().references(() => users.id),
  learnerId: integer("learner_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookmark model
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  skillPostId: integer("skill_post_id").notNull().references(() => skillPosts.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Ensure a user can bookmark a skill post only once
    unq: unique().on(table.userId, table.skillPostId)
  };
});

// Conversation model for messaging
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participants: integer("participants").array().notNull(), // Array of user IDs
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false),
});

// Report model for content moderation
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'user', 'skillPost', 'review'
  itemId: text("item_id").notNull(), // ID of the reported item
  reporterId: integer("reporter_id").references(() => users.id),
  reporterName: text("reporter_name"),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(), // 'pending', 'resolved'
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  xp: true,
  sessionsCompleted: true,
  rating: true,
  reviewCount: true,
  banned: true,
  banReason: true
});

export const insertSkillPostSchema = createInsertSchema(skillPosts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  rating: true,
  reviewCount: true
});

export const insertSessionSchema = createInsertSchema(sessions).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  reviewed: true,
  jitsiLink: true
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ 
  id: true, 
  createdAt: true
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ 
  id: true, 
  createdAt: true
});

export const insertConversationSchema = createInsertSchema(conversations).omit({ 
  id: true, 
  createdAt: true,
  lastMessage: true,
  lastMessageAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  timestamp: true,
  read: true
});

export const insertReportSchema = createInsertSchema(reports).omit({ 
  id: true, 
  createdAt: true,
  status: true,
  resolvedBy: true,
  resolvedAt: true
});

// Export types for use in the application
export type User = typeof users.$inferSelect;
export type SkillPost = typeof skillPosts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Report = typeof reports.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSkillPost = z.infer<typeof insertSkillPostSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;

// API service for server-side data 
import { apiRequest } from './queryClient';

// Skill Posts API
export const getSkillPosts = async (filters = {}) => {
  try {
    // Fetch from our new server API endpoint
    const response = await apiRequest('/api/skills');
    
    // Mock the filtering on client side for now
    let skillPosts = response || [];
    
    // Apply filters if any
    if (filters.active !== undefined) {
      skillPosts = skillPosts.filter(post => post.active === filters.active);
    }
    
    return { skillPosts };
  } catch (error) {
    console.error("Error fetching skills:", error);
    return { skillPosts: [] };
  }
};

export const getSkillPostById = async (postId) => {
  try {
    // Fetch from our new server API endpoint
    const response = await apiRequest(`/api/skills/${postId}`);
    return response;
  } catch (error) {
    console.error("Error fetching skill post:", error);
    return null;
  }
};

export const createSkillPost = async (skillData) => {
  try {
    // Post to our new server API endpoint
    const response = await apiRequest('/api/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response;
  } catch (error) {
    console.error("Error creating skill post:", error);
    throw new Error(error.message);
  }
};

// User API
export const getUserProfile = async (userId) => {
  try {
    // Fetch from our new server API endpoint
    const response = await apiRequest(`/api/users/${userId}`);
    return response;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// User schema
export const users = {
  id: 'number',
  username: 'string',
  password: 'string',
  displayName: 'string',
  email: 'string',
  role: 'string'
};

// Skill posts schema
export const skillPosts = {
  id: 'number',
  mentorId: 'number',
  title: 'string',
  description: 'string',
  tags: 'array',
  experienceLevel: 'string',
  sessionLength: 'number',
  price: 'number',
  rating: 'number',
  reviewCount: 'number',
  active: 'boolean',
  createdAt: 'date',
  updatedAt: 'date'
};

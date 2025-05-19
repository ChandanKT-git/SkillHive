import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AuthForms from '@/components/auth/auth-forms';
import { useAuth } from '../contexts/auth-context';
import { ArrowRight, Video, BarChart2, Users, ThumbsUp, Star, UserCheck } from 'lucide-react';

const Home = () => {
  const auth = useAuth() || {};
  const user = auth.user;
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Features section items
  const features = [
    {
      icon: <Video className="h-8 w-8 text-primary-500" />,
      title: 'Real-Time Learning',
      description: 'Connect face-to-face with mentors through video sessions for personalized guidance.'
    },
    {
      icon: <Users className="h-8 w-8 text-primary-500" />,
      title: 'Peer-to-Peer Exchange',
      description: 'Share your skills and learn from others in our diverse community.'
    },
    {
      icon: <BarChart2 className="h-8 w-8 text-primary-500" />,
      title: 'Track Progress',
      description: 'Monitor your learning journey with detailed progress tracking and achievements.'
    },
    {
      icon: <ThumbsUp className="h-8 w-8 text-primary-500" />,
      title: 'Quality Feedback',
      description: 'Receive constructive feedback and ratings to improve your skills continually.'
    }
  ];

  // Popular skills categories
  const categories = [
    { name: 'Technology', count: 132 },
    { name: 'Design', count: 89 },
    { name: 'Business', count: 64 },
    { name: 'Languages', count: 117 },
    { name: 'Music', count: 78 },
    { name: 'Lifestyle', count: 55 }
  ];

  return (
    <>
      {!user && showAuthModal && (
        <AuthForms onClose={() => setShowAuthModal(false)} />
      )}

      {/* Hero Section */}
      <section className="relative bg-white dark:bg-gray-900 pt-12 pb-20 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left lg:flex lg:flex-col lg:justify-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                <span className="block">Learn and teach skills</span>
                <span className="block text-primary-600 dark:text-primary-500">directly from peers</span>
              </h1>
              <p className="mt-6 text-base text-gray-500 dark:text-gray-400 sm:text-lg md:text-xl">
                SkillSwap connects you with talented individuals worldwide for real-time learning sessions. 
                Share your expertise or master new skills through personalized video interactions.
              </p>
              
              <div className="mt-8 sm:flex sm:justify-center lg:justify-start">
                {!user ? (
                  <>
                    <div className="rounded-md shadow">
                      <Button 
                        onClick={() => setShowAuthModal(true)} 
                        size="lg" 
                        className="w-full sm:w-auto px-8 py-3"
                      >
                        Get Started
                      </Button>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.hash = '#how-it-works'} 
                        size="lg" 
                        className="w-full sm:w-auto px-8 py-3"
                      >
                        Learn More
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-md shadow">
                      <Link href="/explore">
                        <Button size="lg" className="w-full sm:w-auto px-8 py-3">
                          Explore Skills
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link href="/dashboard">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="w-full sm:w-auto px-8 py-3"
                        >
                          My Dashboard
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-8 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-500">1000+</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Skills</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-500">5000+</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Users</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-500">10K+</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sessions</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg overflow-hidden">
                <img 
                  className="w-full" 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&h=800&q=80" 
                  alt="People collaborating on a project" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-gray-50 dark:bg-gray-800 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              How SkillSwap Works
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
              Three simple steps to start learning or teaching
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md dark:shadow-none dark-shadow text-center relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">1</div>
                <div className="h-12 flex items-center justify-center mb-4">
                  <UserCheck className="h-10 w-10 text-primary-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create Your Profile</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Sign up and specify your interests, skills you want to learn, and expertise you can share.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md dark:shadow-none dark-shadow text-center relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">2</div>
                <div className="h-12 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-primary-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Connect With Peers</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Browse available skills or create your own skill post to attract learners.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md dark:shadow-none dark-shadow text-center relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">3</div>
                <div className="h-12 flex items-center justify-center mb-4">
                  <Video className="h-10 w-10 text-primary-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Learn in Real-Time</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Schedule and join video sessions for personalized one-on-one learning experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Why Choose SkillSwap
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
              Discover the benefits of peer-to-peer learning
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none dark-shadow p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Popular Categories
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
              Explore skills across various domains
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-none dark-shadow hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col items-center justify-center p-6"
              >
                <h3 className="text-md font-medium text-gray-900 dark:text-white">{category.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{category.count} mentors</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/explore">
              <Button variant="outline" className="group">
                Explore All Categories
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              What Our Users Say
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
              Testimonials from our community
            </p>
          </div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none dark-shadow p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <img 
                    className="h-12 w-12 rounded-full"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" 
                    alt="User profile"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Sarah Johnson</h4>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "SkillSwap completely changed how I learn. The personalized sessions with real experts made all the difference in mastering web development."
              </p>
              <div className="mt-4">
                <Badge variant="outline">Web Development</Badge>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none dark-shadow p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <img 
                    className="h-12 w-12 rounded-full"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" 
                    alt="User profile"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Michael Chen</h4>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "As a mentor, I've connected with amazing learners worldwide. Sharing my photography skills has been incredibly rewarding both personally and professionally."
              </p>
              <div className="mt-4">
                <Badge variant="outline">Photography</Badge>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none dark-shadow p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <img 
                    className="h-12 w-12 rounded-full"
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150" 
                    alt="User profile"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Emily Taylor</h4>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "I learned Spanish in just a few months through regular sessions with native speakers. The platform makes scheduling and connecting so easy!"
              </p>
              <div className="mt-4">
                <Badge variant="outline">Spanish</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 dark:bg-primary-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to start learning?</span>
            <span className="block text-primary-200">Join SkillSwap today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            {!user ? (
              <div className="inline-flex rounded-md shadow">
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                  variant="secondary"
                  className="px-8 py-3"
                >
                  Get Started
                </Button>
              </div>
            ) : (
              <div className="inline-flex rounded-md shadow">
                <Link href="/explore">
                  <Button 
                    size="lg"
                    variant="secondary"
                    className="px-8 py-3"
                  >
                    Explore Skills
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;

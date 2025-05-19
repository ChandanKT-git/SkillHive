import React, { useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AuthForms = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('both');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address to reset password');
      return;
    }

    try {
      setIsLoading(true);
      await sendPasswordResetEmail(email);
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for further instructions",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up
        await signUp(email, password, { displayName: fullName, role });
        toast({
          title: "Account created successfully!",
          description: "Welcome to SkillSwap",
        });
      } else {
        // Sign in
        await signIn(email, password, rememberMe);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 -mt-16">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <svg className="h-16 w-auto text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white font-heading">
            {isSignUp ? 'Create your account' : 'Welcome to SkillSwap'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? 'Join our community of learners and mentors' : 'Your peer-to-peer learning hub'}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email-address">Email address</Label>
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              {isSignUp && (
                <div>
                  <Label>I want to join as</Label>
                  <RadioGroup 
                    value={role} 
                    onValueChange={setRole}
                    className="mt-2 grid grid-cols-3 gap-3"
                    disabled={isLoading}
                  >
                    <div>
                      <RadioGroupItem value="learner" id="role-learner" className="sr-only" />
                      <Label
                        htmlFor="role-learner"
                        className="p-3 flex border rounded-md justify-center items-center text-sm font-medium uppercase 
                        border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 
                        bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer
                        data-[state=checked]:border-primary-500 data-[state=checked]:text-primary-600 dark:data-[state=checked]:text-primary-400"
                      >
                        <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        Learner
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem value="mentor" id="role-mentor" className="sr-only" />
                      <Label
                        htmlFor="role-mentor"
                        className="p-3 flex border rounded-md justify-center items-center text-sm font-medium uppercase 
                        border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 
                        bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer
                        data-[state=checked]:border-primary-500 data-[state=checked]:text-primary-600 dark:data-[state=checked]:text-primary-400"
                      >
                        <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        Mentor
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem value="both" id="role-both" className="sr-only" />
                      <Label
                        htmlFor="role-both"
                        className="p-3 flex border rounded-md justify-center items-center text-sm font-medium uppercase 
                        border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 
                        bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer
                        data-[state=checked]:border-primary-500 data-[state=checked]:text-primary-600 dark:data-[state=checked]:text-primary-400"
                      >
                        <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Both
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={setRememberMe}
                      disabled={isLoading}
                    />
                    <Label htmlFor="remember-me" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Remember me
                    </Label>
                  </div>

                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                      disabled={isLoading}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'Create account' : 'Sign in'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <button
                    type="button"
                    onClick={toggleSignUp}
                    className="ml-1 font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    disabled={isLoading}
                  >
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForms;

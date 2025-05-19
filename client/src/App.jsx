
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Navbar from "./components/layout/navbar";
import Footer from "./components/layout/footer";
import Home from "./pages/home";
import Explore from "./pages/explore";
import Dashboard from "./pages/dashboard";
import Profile from "./pages/profile";
import Session from "./pages/session";
import Messages from "./pages/messages";
import Admin from "./pages/admin";
import { useAuth } from "./contexts/auth-context";

function Router() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 pb-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Explore} />
          {user ? (
            <>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/profile/:id?" component={Profile} />
              <Route path="/session/:id" component={Session} />
              <Route path="/messages" component={Messages} />
              {user.role === 'admin' && <Route path="/admin" component={Admin} />}
            </>
          ) : null}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import AgentBuilder from "@/pages/AgentBuilder";
import Header from "@/components/Header";
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";
import { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/builder" component={AgentBuilder} />
      <Route path="/builder/:id" component={AgentBuilder} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <div className="min-h-screen flex flex-col">
              <Header 
                onLoginClick={() => setIsLoginModalOpen(true)}
                onSignupClick={() => setIsSignupModalOpen(true)}
              />
              <main className="flex-grow">
                <Router />
              </main>
              <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)}
                onSignupClick={() => {
                  setIsLoginModalOpen(false);
                  setIsSignupModalOpen(true);
                }}
              />
              <SignupModal 
                isOpen={isSignupModalOpen} 
                onClose={() => setIsSignupModalOpen(false)}
                onLoginClick={() => {
                  setIsSignupModalOpen(false);
                  setIsLoginModalOpen(true);
                }}
              />
              <Toaster />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

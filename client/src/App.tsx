import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import CanvasHome from "@/pages/CanvasHome";
import Dashboard from "@/pages/Dashboard";
import AgentBuilder from "@/pages/AgentBuilder";
import SimpleBuilder from "@/pages/SimpleBuilder";
import EnhancedBuilder from "@/pages/EnhancedBuilder";
import Agents from "@/pages/Agents";
import Templates from "@/pages/Templates";
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import Help from "@/pages/Help";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Documentation from "@/pages/Documentation";
import Profile from "@/pages/Profile";
import DeployedAgent from "@/pages/DeployedAgent";
import AgentTester from "@/pages/AgentTester";
import SimpleTest from "@/pages/SimpleTest";
import Blog from "@/pages/Blog";
import CanvasHeader from "@/components/CanvasHeader";
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";
import { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CanvasHome} />
      <Route path="/welcome" component={LandingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/builder" component={AgentBuilder} />
      <Route path="/builder/:id" component={AgentBuilder} />
      <Route path="/simple-builder" component={SimpleBuilder} />
      <Route path="/enhanced-builder" component={EnhancedBuilder} />
      <Route path="/agents" component={Agents} />
      <Route path="/templates" component={Templates} />
      <Route path="/settings" component={Settings} />
      <Route path="/billing" component={Billing} />
      <Route path="/help" component={Help} />
      <Route path="/profile" component={Profile} />
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/agent/:deployId" component={DeployedAgent} />
      <Route path="/agent-tester" component={AgentTester} />
      <Route path="/simple-test" component={SimpleTest} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:id" component={Blog} />
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
              <CanvasHeader 
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
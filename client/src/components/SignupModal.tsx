import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export default function SignupModal({
  isOpen,
  onClose,
  onLoginClick,
}: SignupModalProps) {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      terms: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Create a more user-friendly username by combining first and last name
      // but ensure it's unique by adding a timestamp
      const timestamp = new Date().getTime();
      const username = `${values.firstName.toLowerCase()}${values.lastName.toLowerCase()}${timestamp}`;

      const user = await register({
        username,
        email: values.email,
        password: values.password,
        avatar_url: "",
      });

      if (user) {
        toast({
          title: "Account created successfully",
          description: "Welcome to AIagentStudio.ai",
        });

        onClose();
        // Force a small delay to ensure state updates propagate
        setTimeout(() => {
          window.location.reload();
        }, 100);
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Registration error:", error);

      toast({
        title: "Registration failed",
        description:
          error.message ||
          "This email might already be registered. Please try a different one or log in.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = "/api/auth/google";
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Sign-in failed",
        description: "Failed to initiate Google sign-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold">
            Create an account
          </DialogTitle>
          <DialogDescription className="text-xs">
            Join AIagentStudio.ai to start building your own AI agents
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">First name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} className="h-8 text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">Last name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} className="h-8 text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your@email.com"
                      {...field}
                      disabled={isLoading}
                      className="h-8 text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                      className="h-8 text-sm"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    8+ characters with uppercase, lowercase, and number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs leading-relaxed">
                      I agree to the{" "}
                      <a
                        href="#"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Privacy Policy
                      </a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-8 text-sm" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
        </Form>

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-gray-300 absolute w-full"></div>
          <div className="bg-white px-2 relative text-xs text-gray-500">
            or continue with
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 h-8 text-sm"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <DialogFooter className="sm:justify-center mt-2">
          <p className="text-center text-xs text-gray-600">
            Already have an account?{" "}
            <Button
              variant="link"
              className="text-primary-600 hover:text-primary-700 p-0 h-auto text-xs"
              onClick={() => {
                onClose();
                onLoginClick();
              }}
              disabled={isLoading}
            >
              Log in
            </Button>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

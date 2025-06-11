
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

interface SubscriptionFormProps {
  placeholder?: string;
  buttonText?: string;
  className?: string;
}

export default function SubscriptionForm({ 
  placeholder = "Enter your email to get started",
  buttonText = "Join Now",
  className = ""
}: SubscriptionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/waitlist', { email: values.email });
      
      toast({
        title: "Welcome to the AI Revolution! 🚀",
        description: "You're now subscribed to get exclusive updates and early access.",
      });
      
      form.reset();
    } catch (error) {
      const errorMessage = 
        error instanceof Error ? error.message : 'Failed to subscribe. Please try again.';
      
      toast({
        title: "Subscription failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={`max-w-lg mx-auto ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-2">
        <div className="flex-1">
          <input
            type="email"
            placeholder={placeholder}
            value={form.watch('email')}
            onChange={(e) => form.setValue('email', e.target.value)}
            disabled={isSubmitting}
            className="w-full px-6 py-4 bg-white/90 text-gray-900 placeholder-gray-500 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 text-lg"
          />
          {form.formState.errors.email && (
            <p className="text-red-300 text-sm mt-2 ml-2">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-4 bg-white text-brand-blue font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-70 disabled:transform-none"
        >
          {isSubmitting ? 'Joining...' : buttonText}
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </form>
  );
}

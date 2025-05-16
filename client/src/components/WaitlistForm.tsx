import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function WaitlistForm() {
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
        title: "Thank you for joining our waitlist!",
        description: "We'll notify you when we launch.",
      });
      
      form.reset();
    } catch (error) {
      const errorMessage = 
        error instanceof Error ? error.message : 'Failed to join the waitlist. Please try again.';
      
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md mx-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl>
                  <Input 
                    placeholder="Enter your email" 
                    {...field} 
                    disabled={isSubmitting}
                    className="px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm"
          >
            {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
          </Button>
        </div>
      </form>
      <p className="text-primary-200 mt-4 text-sm text-center">
        We'll never share your email. Unsubscribe anytime.
      </p>
    </Form>
  );
}

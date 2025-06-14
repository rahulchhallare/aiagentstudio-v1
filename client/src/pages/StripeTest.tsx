
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';

export default function StripeTest() {
  const [customerId, setCustomerId] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');
  const { updateCustomer, updateSubscription, isLoading } = usePayment();
  const { toast } = useToast();

  const testUpdateCustomer = async () => {
    if (!customerId) {
      toast({
        title: "Error",
        description: "Please enter a customer ID",
        variant: "destructive",
      });
      return;
    }

    const result = await updateCustomer(customerId, { footer: '' });
    if (result) {
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    }
  };

  const testUpdateSubscription = async () => {
    if (!subscriptionId) {
      toast({
        title: "Error", 
        description: "Please enter a subscription ID",
        variant: "destructive",
      });
      return;
    }

    const result = await updateSubscription(subscriptionId, {
      items: [{
        id: 'si_SU7RAau8LKewtx',
        quantity: 1,
        discounts: [],
        tax_rates: []
      }],
      discounts: [],
      off_session: true,
      payment_behavior: 'error_if_incomplete',
      proration_behavior: 'none'
    });

    if (result) {
      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Stripe Integration Test</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Customer Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Customer ID (e.g., cus_SU7PeetRPOAMPm)"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
            <Button 
              onClick={testUpdateCustomer} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Updating..." : "Update Customer"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Subscription Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Subscription ID (e.g., sub_1RZ9CyQTNPgFvxI8REYIo6nv)"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
            />
            <Button 
              onClick={testUpdateSubscription} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Updating..." : "Update Subscription"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Card Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Success:</strong> 4242 4242 4242 4242</p>
            <p><strong>Declined:</strong> 4000 0000 0000 0002</p>
            <p><strong>3D Secure:</strong> 4000 0027 6000 3184</p>
            <p><strong>Insufficient Funds:</strong> 4000 0000 0000 9995</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

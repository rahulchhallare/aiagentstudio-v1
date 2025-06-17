
-- Update subscriptions table to support Razorpay
ALTER TABLE subscriptions ADD COLUMN razorpay_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN razorpay_customer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN plan_id VARCHAR(255);

-- Update payment_history table to support Razorpay
ALTER TABLE payment_history ADD COLUMN razorpay_payment_id VARCHAR(255);

-- Update webhook_events table to support Razorpay
ALTER TABLE webhook_events ADD COLUMN razorpay_event_id VARCHAR(255);

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_razorpay_subscription_id ON subscriptions(razorpay_subscription_id);
CREATE INDEX idx_subscriptions_razorpay_customer_id ON subscriptions(razorpay_customer_id);
CREATE INDEX idx_payment_history_razorpay_payment_id ON payment_history(razorpay_payment_id);
CREATE INDEX idx_webhook_events_razorpay_event_id ON webhook_events(razorpay_event_id);

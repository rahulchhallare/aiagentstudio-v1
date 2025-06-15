import Footer from '@/components/Footer';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white">
      
      <main className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Cancellation & Refund Policy
            </h1>
            <p className="text-xl text-gray-600">
              Clear and transparent policies for subscription cancellations and refunds
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Quick Summary:</strong> You can cancel your subscription anytime. Refunds are generally not provided for subscription fees already paid, except as required by law or in special circumstances outlined below.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Subscription Cancellation</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Cancel</h3>
              <p className="text-gray-600 mb-4">
                You may cancel your AIAgentStudio.AI subscription at any time through:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li>Your account dashboard under "Billing" settings</li>
                <li>Contacting our support team at support@aiagentstudio.ai</li>
                <li>Using the cancellation link in your billing emails</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">When Cancellation Takes Effect</h3>
              <p className="text-gray-600 mb-6">
                When you cancel your subscription:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li>Your cancellation is effective immediately</li>
                <li>You retain access to paid features until the end of your current billing period</li>
                <li>Your account automatically converts to our free plan at the end of the billing cycle</li>
                <li>No additional charges will be made after cancellation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Refund Policy</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">General Refund Terms</h3>
              <p className="text-gray-600 mb-6">
                Subscription fees are billed in advance and are generally non-refundable. This policy helps us maintain competitive pricing and continue developing new features for all users.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Exceptions and Special Circumstances</h3>
              <p className="text-gray-600 mb-4">
                We may provide refunds in the following situations:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li><strong>Technical Issues:</strong> Extended service outages lasting more than 72 consecutive hours</li>
                <li><strong>Billing Errors:</strong> Incorrect charges due to system errors on our part</li>
                <li><strong>Duplicate Charges:</strong> Accidental multiple billing for the same period</li>
                <li><strong>Legal Requirements:</strong> Where refunds are required by applicable consumer protection laws</li>
                <li><strong>First-Time Users:</strong> 7-day satisfaction guarantee for new subscribers (see details below)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">3. 7-Day Satisfaction Guarantee</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">New User Protection</h3>
              <p className="text-gray-600 mb-4">
                First-time subscribers to any paid plan are eligible for a full refund if:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li>You request the refund within 7 days of your initial subscription</li>
                <li>You have not previously held a paid subscription with AIAgentStudio.AI</li>
                <li>You contact our support team with your refund request</li>
                <li>You provide brief feedback about your experience (optional but appreciated)</li>
              </ul>

              <p className="text-gray-600 mb-6">
                This guarantee applies only to the first billing period and cannot be combined with other offers or promotions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Usage-Based Billing</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">API Calls and Usage Fees</h3>
              <p className="text-gray-600 mb-6">
                For usage-based features (such as AI model API calls):
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li>Charges are based on actual usage and are non-refundable</li>
                <li>You will receive clear notifications before incurring usage charges</li>
                <li>Usage limits and spending caps can be set in your account settings</li>
                <li>Billing occurs monthly for the previous month's usage</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Refund Process</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Request a Refund</h3>
              <ol className="list-decimal pl-6 mb-6 text-gray-600">
                <li>Contact our support team at support@aiagentstudio.ai</li>
                <li>Include your account email and subscription details</li>
                <li>Explain the reason for your refund request</li>
                <li>Provide any relevant documentation (for billing errors)</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Processing Time</h3>
              <p className="text-gray-600 mb-6">
                Approved refunds will be processed within:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li>5-7 business days for credit card payments</li>
                <li>3-5 business days for PayPal payments</li>
                <li>Bank transfers may take 7-10 business days depending on your financial institution</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Account Closure</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Retention</h3>
              <p className="text-gray-600 mb-6">
                When you cancel your subscription:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li>Your account data is preserved and accessible on the free plan</li>
                <li>AI agents and workflows remain saved but may have usage limitations</li>
                <li>You can request complete account deletion by contacting support</li>
                <li>Data deletion is permanent and cannot be reversed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Legal Considerations</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Consumer Rights</h3>
              <p className="text-gray-600 mb-6">
                This policy does not affect your statutory rights under applicable consumer protection laws. In some jurisdictions, you may have additional rights including:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li>Right to cancel within a cooling-off period</li>
                <li>Right to refund for services not provided as described</li>
                <li>Protection against unfair contract terms</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Dispute Resolution</h3>
              <p className="text-gray-600 mb-6">
                If you disagree with a refund decision, you may:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li>Request escalation to our management team</li>
                <li>Contact your credit card company to dispute the charge</li>
                <li>Seek resolution through applicable consumer protection agencies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Contact Information</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Help</h3>
                <p className="text-gray-600 mb-4">
                  For questions about cancellations, refunds, or billing:
                </p>
                <ul className="text-gray-600 space-y-2">
                  <li><strong>Email:</strong> support@aiagentstudio.ai</li>
                  <li><strong>Support Hours:</strong> Monday-Friday, 9 AM - 6 PM EST</li>
                  <li><strong>Response Time:</strong> Within 24 hours for billing inquiries</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Policy Updates</h2>
              <p className="text-gray-600 mb-6">
                We may update this Cancellation & Refund Policy from time to time. When we make changes:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600">
                <li>We will notify you via email and in-app notifications</li>
                <li>Changes take effect 30 days after notification</li>
                <li>Continued use of the service constitutes acceptance of the updated policy</li>
                <li>Previous versions are archived and available upon request</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
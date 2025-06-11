import { FileText, Shield, AlertTriangle, Users, Gavel, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";

export default function TermsOfService() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Terms of <span className="text-brand-blue">Service</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              These terms govern your use of AIAgentStudio.AI. Please read them carefully before using our platform.
            </p>
            <p className="text-gray-500">Last updated: June 11, 2025</p>
          </div>
        </section>

        {/* Key Points */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Points</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Here are the most important aspects of our terms that you should know.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader className="text-center">
                  <FileText className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                  <CardTitle>Service Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    Use our platform responsibly and in accordance with applicable laws.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="text-center">
                  <Shield className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                  <CardTitle>Intellectual Property</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    You retain ownership of your content while respecting our platform rights.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="text-center">
                  <AlertTriangle className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                  <CardTitle>Prohibited Uses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    Certain activities are not allowed on our platform for everyone's safety.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Acceptance of Terms</h2>
                <p className="text-gray-600 mb-6">
                  By accessing and using AIAgentStudio.AI ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, you should not use this Service.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Description of Service</h2>
                <p className="text-gray-600 mb-6">
                  AIAgentStudio.AI is a no-code platform that enables users to create, deploy, and manage AI agents through a drag-and-drop interface. The Service includes access to various AI models, templates, and deployment capabilities.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. User Accounts</h2>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Creation</h3>
                <p className="text-gray-600 mb-6">
                  To use certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Security</h3>
                <p className="text-gray-600 mb-6">
                  You are responsible for safeguarding the password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Acceptable Use Policy</h2>
                <p className="text-gray-600 mb-4">You agree not to use the Service to:</p>
                <ul className="text-gray-600 mb-6 space-y-2">
                  <li>• Create AI agents that generate harmful, illegal, or inappropriate content</li>
                  <li>• Violate any applicable laws or regulations</li>
                  <li>• Infringe on the intellectual property rights of others</li>
                  <li>• Attempt to reverse engineer or compromise the security of the platform</li>
                  <li>• Use the Service to spam, harass, or harm others</li>
                  <li>• Create AI agents that impersonate real individuals without consent</li>
                  <li>• Generate content that promotes violence, hatred, or discrimination</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Intellectual Property Rights</h2>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Content</h3>
                <p className="text-gray-600 mb-6">
                  You retain all rights to the content you create using our platform, including AI agents, prompts, and outputs. However, you grant us a limited license to host, store, and process your content to provide the Service.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Platform</h3>
                <p className="text-gray-600 mb-6">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of AIAgentStudio.AI and its licensors. The Service is protected by copyright, trademark, and other laws.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Privacy and Data Protection</h2>
                <p className="text-gray-600 mb-6">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your information.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Payment Terms</h2>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Subscription Plans</h3>
                <p className="text-gray-600 mb-6">
                  Some features of the Service require payment. Subscription fees are billed in advance on a monthly or annual basis and are non-refundable except as required by law.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage-Based Billing</h3>
                <p className="text-gray-600 mb-6">
                  Certain features may be billed based on usage (e.g., AI model API calls). You will be clearly informed of any usage-based charges before they are incurred.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Service Availability</h2>
                <p className="text-gray-600 mb-6">
                  We strive to maintain high availability of our Service, but we do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Limitation of Liability</h2>
                <p className="text-gray-600 mb-6">
                  To the maximum extent permitted by applicable law, AIAgentStudio.AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Disclaimers</h2>
                <p className="text-gray-600 mb-6">
                  The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no representations or warranties of any kind, express or implied, as to the operation of the Service or the information, content, or materials included therein.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Indemnification</h2>
                <p className="text-gray-600 mb-6">
                  You agree to defend, indemnify, and hold harmless AIAgentStudio.AI from and against any claims, damages, costs, and expenses arising from or related to your use of the Service or violation of these Terms.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Termination</h2>
                <p className="text-gray-600 mb-6">
                  We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will cease immediately.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Governing Law</h2>
                <p className="text-gray-600 mb-6">
                  These Terms shall be interpreted and governed by the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising from these Terms will be resolved in the courts of San Francisco, California.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">14. Changes to Terms</h2>
                <p className="text-gray-600 mb-6">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">15. Contact Information</h2>
                <p className="text-gray-600 mb-6">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>

                <div className="bg-gray-100 p-6 rounded-lg">
                  <p className="text-gray-600">
                    Email: legal@aiagentstudio.ai<br />
                    Address: AIAgentStudio.AI Legal Team<br />
                    San Francisco, CA, United States
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
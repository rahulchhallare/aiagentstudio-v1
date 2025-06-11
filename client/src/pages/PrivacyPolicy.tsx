import { Shield, Eye, Lock, Database, Users, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Privacy <span className="text-brand-blue">Policy</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your privacy is fundamental to us. Learn how we collect, use, and protect your information.
            </p>
            <p className="text-gray-500">Last updated: June 11, 2025</p>
          </div>
        </section>

        {/* Privacy Principles */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Privacy Principles</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                These principles guide how we handle your data and protect your privacy.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader className="text-center">
                  <Shield className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                  <CardTitle>Data Minimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    We only collect data that's necessary to provide and improve our services.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="text-center">
                  <Eye className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                  <CardTitle>Transparency</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    We're clear about what data we collect and how we use it.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="text-center">
                  <Lock className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                  <CardTitle>Security First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">
                    Your data is protected with industry-leading security measures.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h3>
                <p className="text-gray-600 mb-6">
                  When you create an account, we collect your name, email address, and password. This information is necessary to provide you with access to our platform and communicate important updates about your account.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage Data</h3>
                <p className="text-gray-600 mb-6">
                  We collect information about how you use our platform, including the AI agents you create, templates you use, and features you interact with. This helps us improve our platform and provide better recommendations.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Information</h3>
                <p className="text-gray-600 mb-6">
                  We automatically collect certain technical information, including your IP address, browser type, device information, and operating system. This information helps us ensure our platform works properly across different devices and browsers.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">How We Use Your Information</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Provision</h3>
                <p className="text-gray-600 mb-6">
                  We use your information to provide, maintain, and improve our AI agent platform. This includes processing your AI agent requests, storing your created agents, and providing customer support.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Communication</h3>
                <p className="text-gray-600 mb-6">
                  We may use your contact information to send you important updates about our service, security alerts, and occasionally, information about new features that may interest you. You can opt out of marketing communications at any time.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform Improvement</h3>
                <p className="text-gray-600 mb-6">
                  We analyze usage patterns to understand how our platform is being used and to identify areas for improvement. This analysis is performed on aggregated, anonymized data.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">Information Sharing</h2>
                
                <p className="text-gray-600 mb-6">
                  We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
                </p>

                <ul className="text-gray-600 mb-6 space-y-2">
                  <li>• <strong>Service Providers:</strong> We work with trusted third-party service providers who help us operate our platform. These providers are bound by strict confidentiality agreements.</li>
                  <li>• <strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
                  <li>• <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of our company, your information may be transferred as part of that transaction.</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">Data Security</h2>
                
                <p className="text-gray-600 mb-6">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
                </p>

                <ul className="text-gray-600 mb-6 space-y-2">
                  <li>• Encryption of data in transit and at rest</li>
                  <li>• Regular security assessments and audits</li>
                  <li>• Access controls and authentication mechanisms</li>
                  <li>• Employee training on data protection practices</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">Your Rights</h2>
                
                <p className="text-gray-600 mb-6">
                  You have several rights regarding your personal information:
                </p>

                <ul className="text-gray-600 mb-6 space-y-2">
                  <li>• <strong>Access:</strong> You can request a copy of the personal information we hold about you</li>
                  <li>• <strong>Correction:</strong> You can ask us to correct any inaccurate or incomplete information</li>
                  <li>• <strong>Deletion:</strong> You can request that we delete your personal information</li>
                  <li>• <strong>Portability:</strong> You can request a copy of your data in a machine-readable format</li>
                  <li>• <strong>Objection:</strong> You can object to certain types of processing of your information</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">Data Retention</h2>
                
                <p className="text-gray-600 mb-6">
                  We retain your personal information only for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy. When you delete your account, we will delete your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">International Data Transfers</h2>
                
                <p className="text-gray-600 mb-6">
                  Our services are provided globally, and your information may be processed in countries other than your own. We ensure that all such transfers are protected by appropriate safeguards, including standard contractual clauses approved by relevant authorities.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">Children's Privacy</h2>
                
                <p className="text-gray-600 mb-6">
                  Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have inadvertently collected such information, we will delete it immediately.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">Changes to This Policy</h2>
                
                <p className="text-gray-600 mb-6">
                  We may update this privacy policy from time to time to reflect changes in our practices or applicable law. We will notify you of any material changes by posting the updated policy on our website and, where appropriate, by email.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">Contact Us</h2>
                
                <p className="text-gray-600 mb-6">
                  If you have any questions about this privacy policy or our data practices, please contact us at:
                </p>

                <div className="bg-gray-100 p-6 rounded-lg">
                  <p className="text-gray-600">
                    Email: privacy@aiagentstudio.ai<br />
                    Address: AIAgentStudio.AI Privacy Team<br />
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
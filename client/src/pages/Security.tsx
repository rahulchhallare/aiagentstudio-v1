import { Shield, Lock, Eye, Server, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";

export default function Security() {
  const securityMeasures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All data is encrypted in transit and at rest using AES-256 encryption standards.",
      status: "Implemented"
    },
    {
      icon: Shield,
      title: "SOC 2 Type II Compliance",
      description: "We undergo regular third-party security audits to ensure compliance with industry standards.",
      status: "Certified"
    },
    {
      icon: Server,
      title: "Secure Infrastructure",
      description: "Our platform runs on enterprise-grade cloud infrastructure with 99.9% uptime SLA.",
      status: "Active"
    },
    {
      icon: Eye,
      title: "Continuous Monitoring",
      description: "24/7 security monitoring and automated threat detection systems protect your data.",
      status: "Active"
    }
  ];

  const certifications = [
    { name: "SOC 2 Type II", status: "Current" },
    { name: "ISO 27001", status: "In Progress" },
    { name: "GDPR Compliant", status: "Current" },
    { name: "CCPA Compliant", status: "Current" },
    { name: "HIPAA Ready", status: "Available" }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Security & <span className="text-brand-blue">Compliance</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your data security is our top priority. Learn about the comprehensive measures we take to protect your information and ensure platform reliability.
            </p>
          </div>
        </section>

        {/* Security Overview */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Security Measures</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We implement multiple layers of security to protect your data and ensure safe AI agent operations.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {securityMeasures.map((measure) => (
                <Card key={measure.title} className="border-l-4 border-l-brand-blue">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <measure.icon className="h-8 w-8 text-brand-blue mr-3" />
                        <CardTitle className="text-xl">{measure.title}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-brand-green border-brand-green">
                        {measure.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{measure.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Data Protection</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Encryption Standards</h3>
                  <ul className="text-gray-600 space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand-green mr-2 mt-0.5 flex-shrink-0" />
                      AES-256 encryption for data at rest
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand-green mr-2 mt-0.5 flex-shrink-0" />
                      TLS 1.3 for data in transit
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand-green mr-2 mt-0.5 flex-shrink-0" />
                      End-to-end encryption for sensitive operations
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand-green mr-2 mt-0.5 flex-shrink-0" />
                      Hardware security modules (HSMs) for key management
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Access Controls</h3>
                  <ul className="text-gray-600 space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand-green mr-2 mt-0.5 flex-shrink-0" />
                      Multi-factor authentication (MFA)
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand-green mr-2 mt-0.5 flex-shrink-0" />
                      Role-based access control (RBAC)
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand-green mr-2 mt-0.5 flex-shrink-0" />
                      Regular access reviews and audits
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand-green mr-2 mt-0.5 flex-shrink-0" />
                      Principle of least privilege enforcement
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Infrastructure Security */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Infrastructure Security</h2>
              <div className="prose prose-lg mx-auto text-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Cloud Security</h3>
                <p className="mb-6">
                  Our platform is built on enterprise-grade cloud infrastructure provided by leading cloud service providers. All infrastructure components are configured according to industry best practices and security frameworks.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Network Security</h3>
                <p className="mb-6">
                  We implement multiple layers of network security including firewalls, intrusion detection systems, and DDoS protection. All network traffic is monitored and analyzed for potential threats.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Backup and Recovery</h3>
                <p className="mb-6">
                  Automated daily backups ensure your data is protected against loss. Our disaster recovery procedures guarantee rapid restoration of services with minimal downtime.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">Vulnerability Management</h3>
                <p className="mb-6">
                  We conduct regular vulnerability assessments and penetration testing. All identified vulnerabilities are promptly addressed according to their severity level.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Compliance & Certifications</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We maintain compliance with major industry standards and regulations to ensure your data is handled according to the highest standards.
              </p>
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-4xl mx-auto">
              {certifications.map((cert) => (
                <Card key={cert.name} className="text-center">
                  <CardContent className="p-6">
                    <Shield className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">{cert.name}</h3>
                    <Badge 
                      variant={cert.status === 'Current' ? 'default' : 'secondary'}
                      className={cert.status === 'Current' ? 'bg-brand-green' : ''}
                    >
                      {cert.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security Incident Response */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Incident Response</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <AlertTriangle className="h-8 w-8 text-brand-blue mb-2" />
                    <CardTitle>Rapid Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Our security team monitors the platform 24/7 and can respond to incidents within minutes. We have established procedures for containment, investigation, and resolution.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Eye className="h-8 w-8 text-brand-blue mb-2" />
                    <CardTitle>Transparent Communication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      In the event of a security incident that may affect your data, we commit to transparent and timely communication about the nature of the incident and our response.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Security Contact */}
        <section className="py-16 bg-gradient-to-r from-brand-blue to-brand-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Security Questions?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Have security concerns or want to report a vulnerability? Our security team is here to help.
            </p>
            <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-white/90 mb-2">Security Team Contact:</p>
              <p className="font-semibold">security@aiagentstudio.ai</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
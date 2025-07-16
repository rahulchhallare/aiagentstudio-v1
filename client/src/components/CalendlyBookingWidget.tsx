import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface CalendlyBookingWidgetProps {
  title?: string;
  description?: string;
  calendlyUrl?: string;
  height?: number;
}

export default function CalendlyBookingWidget({
  title = "Schedule Your Free AI Expert Consultation",
  description = "Book a 30-minute consultation with our certified AI experts to discuss your implementation strategy, get personalized recommendations, and see live demos of your selected solutions.",
  calendlyUrl = "https://calendly.com/aiagentstudio9/30min",
  height = 700
}: CalendlyBookingWidgetProps) {
  useEffect(() => {
    // Load Calendly script if not already loaded
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <Card className="border-2 border-brand-blue">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <BarChart3 className="w-12 h-12 text-brand-blue mx-auto mb-3" />
          <h4 className="font-semibold text-xl mb-2">
            {title}
          </h4>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>
        
        {/* Calendly inline widget */}
        <div 
          className="calendly-inline-widget" 
          data-url={calendlyUrl}
          style={{ minWidth: '320px', height: `${height}px` }}
        />
      </CardContent>
    </Card>
  );
}
import React from "react";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col space-y-4">
          <Separator />
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                © {currentYear} IPS Tools. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Independent research tool. Not affiliated with or endorsed by Amazon.
              </p>
            </div>
            <div className="flex flex-col text-center md:text-right">
              <p className="text-xs text-muted-foreground">
                For educational and research purposes only.
              </p>
              <p className="text-xs text-muted-foreground">
                Use in compliance with Amazon's Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
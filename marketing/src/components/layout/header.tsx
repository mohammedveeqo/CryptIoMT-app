"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Menu, X, LogIn } from "lucide-react";
import { useState } from "react";

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { label: "Home", sectionId: "home" },
    { label: "About", sectionId: "about" },
    { label: "Services", sectionId: "services" },
    { label: "Contact", sectionId: "contact" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo */}
        <button onClick={() => scrollToSection("home")} className="flex items-center space-x-2">
          <Logo size="lg" />
        </button>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="flex space-x-1">
            {navigationItems.slice(1).map((item) => (
              <NavigationMenuItem key={item.sectionId}>
                <button
                  onClick={() => scrollToSection(item.sectionId)}
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-50 focus:text-gray-900 focus:outline-none"
                >
                  {item.label}
                </button>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* CTA Button */}
        <div className="hidden md:flex items-center space-x-3">
          <Button 
            variant="ghost"
            size="sm" 
            className="text-gray-700 hover:text-gray-900"
            asChild
          >
            <a href="https://app.cryptiomt.com/login" target="_blank" rel="noopener noreferrer">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </a>
          </Button>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => scrollToSection("contact")}
          >
            Get Assessment
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.sectionId}
                onClick={() => {
                  scrollToSection(item.sectionId);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                {item.label}
              </button>
            ))}
            <Button 
              size="sm" 
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                scrollToSection("contact");
                setIsMobileMenuOpen(false);
              }}
            >
              Get Assessment
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              className="w-full mt-1 text-gray-700 hover:text-gray-900"
              asChild
            >
              <a href="https://app.cryptiomt.com/login" target="_blank" rel="noopener noreferrer">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

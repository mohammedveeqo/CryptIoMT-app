import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { AboutSection } from "@/components/sections/about-section";
import { ContactForm } from "@/components/sections/contact-form";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* 1. Hero */}
        <div id="home">
          <Hero />
        </div>
        
        {/* 2. About Us */}
        <div id="about">
          <AboutSection />
        </div>
        
        {/* 3. Our Services */}
        <div id="services">
          <Services />
        </div>
        
        {/* 4. Contact */}
        <div id="contact">
          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  );
}

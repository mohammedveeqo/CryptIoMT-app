import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RiskAssessmentHero } from "@/components/sections/risk-assessment-hero";
import { RiskMatrix } from "@/components/sections/risk-matrix";
import { AssessmentTools } from "@/components/sections/assessment-tools";
import { RiskCategories } from "@/components/sections/risk-categories";
import { AssessmentCTA } from "@/components/sections/assessment-cta";
import { ContactForm } from "@/components/sections/contact-form";

export const metadata = {
  title: "Risk Assessment - CryptIoMT Healthcare Cybersecurity",
  description: "Comprehensive cybersecurity risk assessment tools and frameworks for healthcare organizations. Evaluate IoMT device vulnerabilities and implement NIST-aligned security controls.",
};

export default function RiskAssessmentPage() {
  return (
    <>
      <Header />
      <main>
        <RiskAssessmentHero />
        <RiskMatrix />
        <RiskCategories />
        <AssessmentTools />
        <AssessmentCTA />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
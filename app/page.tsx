import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { Partners } from "@/components/site/partners";
import { Features } from "@/components/site/features";
import { HowItWorks } from "@/components/site/how-it-works";
import { UseCases } from "@/components/site/use-cases";
import { Testimonials } from "@/components/site/testimonials";
import { Faq } from "@/components/site/faq";
import { CtaFooter } from "@/components/site/cta-footer";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <Header />
      <main className="flex flex-col">
        <Hero />
        <Partners />
        <Features />
        <HowItWorks />
        <UseCases />
        <Testimonials />
        <Faq />
      </main>
      <CtaFooter />
    </div>
  );
}

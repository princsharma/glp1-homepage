import HeroSection from "@/components/sections/HeroSection";
import LoseWeightSection from "@/components/sections/LoseWeightSection";
import BMICalculator from "@/components/sections/BMICalculator";
import HowItWorks from "@/components/sections/HowItWorks";
import CreateGLP1Plan from "@/components/sections/CreateGLP1Plan";
// import Services from "@/components/sections/Services";
import CTAButton from "@/components/sections/CTAButton";
import ProductReviews from "@/components/sections/ProductReviews";
// import WhoIsItFor from "@/components/sections/WhoIsItFor";
import OngoSolution from "@/components/sections/OngoSolution";
import AppMobileCTA from "@/components/sections/AppMobileCTA";
import Faq from "@/components/sections/Faq";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function HomePage() {
  return (
    <main className="flex flex-col w-full">
      <HeroSection />
      <LoseWeightSection />
      <BMICalculator />
      <HowItWorks />
      <CreateGLP1Plan />
      {/* <Services /> */}
      <CTAButton />
      <ProductReviews />
      {/* <WhoIsItFor /> */}
      <OngoSolution />
      <AppMobileCTA />
      <Faq />
       <ThemeSwitcher />
    </main>
  );
}

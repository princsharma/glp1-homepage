import HeroSection from "@/components/sections/HeroSection";
import LoseWeightSection from "@/components/sections/LoseWeightSection";
import BMICalculator from "@/components/sections/BMICalculator";
import HowItWorks from "@/components/sections/HowItWorks";
import CreateGLP1Plan from "@/components/sections/CreateGLP1Plan";
import CTAButton from "@/components/sections/CTAButton";
import ProductReviews from "@/components/sections/ProductReviews";
import OngoSolution from "@/components/sections/OngoSolution";
import AppMobileCTA from "@/components/sections/AppMobileCTA";
import Faq from "@/components/sections/Faq";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Header from "@/components/Header";
import Cascade from "@/components/Cascade";
import GLP1Education from "@/components/sections/GLP1Education";
import Pricing from "@/components/sections/pricing";
export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex flex-col w-full">
        {/* Hero — no animation, loads in immediately */}
        <div id="hero"><HeroSection /></div>

     <div id="lose-weight">
  <Cascade ><LoseWeightSection /></Cascade>
</div>
<div id="how-it-works">
  <Cascade from="right"><HowItWorks /></Cascade>
</div>

<div id="bmi">
  <Cascade from="left"><BMICalculator /></Cascade>
</div>


<div id="plans">
  <Cascade from="right"><CreateGLP1Plan /></Cascade>
</div>

<div id="why-us">
  <Cascade from="left"><CTAButton /></Cascade>
</div>
<div id="pricing">
  <Cascade from="right"><Pricing /></Cascade>
</div>
<div id="reviews">
  <Cascade from="left"><ProductReviews /></Cascade>
</div>

<div id="glpeducation">
  <Cascade from="right"><GLP1Education /></Cascade>
</div>

<div id="doctors">
  <Cascade from="left"><OngoSolution /></Cascade>
</div>

<div id="faq">
  <Cascade from="right"><Faq /></Cascade>
</div>

<div id="get-started">
  <Cascade from="left"><AppMobileCTA /></Cascade>
</div>
        <ThemeSwitcher />
      </main>
    </>
  );
}
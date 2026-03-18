import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import AIBanner from "@/components/AIBanner";
import PersonalizedFeed from "@/components/PersonalizedFeed";
import Footer from "@/components/Footer";
import RecommendedForYou from "@/components/RecommendedForYou";
import { GroupRecommendations } from "@/components/GroupRecommendations";
import { useContext } from "react";
import { useGroups } from "@/contexts/GroupContext";
import { getStoredUser } from "@/lib/auth";

const Index = () => {
  const { groups: userGroups } = useGroups();
  const storedUser = getStoredUser();
  const hasGroups = userGroups && userGroups.length > 0;

  return (
    <div className="min-h-screen">
      <HeroSection />
      <PersonalizedFeed />
      <CategorySection />
      <FeaturedProducts />
      <RecommendedForYou />
      {hasGroups && (
        <section className="py-12 bg-gradient-to-r from-accent/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8 font-display">Best for Your Group</h2>
            <GroupRecommendations products={[]} />
          </div>
        </section>
      )}
      <AIBanner />
      <Footer />
    </div>
  );
};

export default Index;

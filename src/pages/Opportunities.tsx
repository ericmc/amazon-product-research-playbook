import OpportunitiesList from "@/components/OpportunitiesList";

const OpportunitiesPage = () => {
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-16">
        <OpportunitiesList />
      </div>
    </main>
  );
};

export default OpportunitiesPage;
export const metadata = {
  title: "Forum Thread - Product Bazar",
  description: "Join the discussion on Product Bazar's forum thread.",
};

export default function ThreadLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="thread-container max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </div>
    </div>
  );
}

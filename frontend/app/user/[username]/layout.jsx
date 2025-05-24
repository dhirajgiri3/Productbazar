import { ProductProvider } from "@/lib/contexts/product-context";

export async function generateMetadata({ params }) {
  // Fetch user data from the API
  const { username } = await params;
  let title = `${username} User Profile - Product Bazar`;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5004/api/v1'}/auth/user/username/${username}`);

    if (response.ok) {
      const data = await response.json();
      if (data.status === "success" && data.data?.user) {
        const user = data.data.user;
        // Use first and last name if available, otherwise fall back to username
        if (user.firstName || user.lastName) {
          title = `${user.firstName || ''} ${user.lastName || ''} - Product Bazar`;
        }
      }
    }
  } catch (error) {
    // If there's an error fetching the user, we'll use the username in the title
    console.error('Error fetching user data for metadata:', error);
  }

  return {
    title: title.trim(),
    description: "View and manage your profile on Product Bazar.",
    keywords: "user profile, account, personal information",
  };
}

export default function UserProfileLayout({ children }) {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      <div className="profile-container mx-auto min-h-screen">
        <ProductProvider>{children}</ProductProvider>
      </div>
    </div>
  );
}

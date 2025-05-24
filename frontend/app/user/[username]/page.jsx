import { makePriorityRequest } from '@/lib/api/api';
import ProfilePage from './Components/ProfileTabs/ProfilePage';
import logger from '@/lib/utils/logger';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { username } = await params;
  
  try {
    const userResponse = await makePriorityRequest('get', `/auth/user/username/${username}`);
    if (userResponse.data?.status !== 'success' || !userResponse.data.data.user) {
      return {
        title: 'User Not Found',
        description: 'The requested user profile could not be found'
      };
    }
    
    const user = userResponse.data.data.user;
    return {
      title: `${user.name || user.username} | Profile`,
      description: user.bio || `${user.username}'s profile`
    };
  } catch (error) {
    return {
      title: 'User Profile',
      description: 'User profile page'
    };
  }
}

export default async function UserProfilePage({ params }) {
  const { username } = await params;

  try {
    // Fetch user data
    const userResponse = await makePriorityRequest('get', `/auth/user/username/${username}`);
    if (userResponse.data?.status !== 'success' || !userResponse.data.data.user) {
      // This will trigger Next.js to show the not-found page
      notFound();
    }
    const user = userResponse.data.data.user;

    // Fetch products data
    const productsResponse = await makePriorityRequest('get', `/products/user/${user._id}`, {
      params: { page: 1, limit: 6, filter: 'all' },
    });
    const products = productsResponse.data?.data || [];
    const totalPages = productsResponse.data?.totalPages || 1;
    const statusCounts = {
      all: productsResponse.data?.totalCount || 0,
      published: productsResponse.data?.statusCounts?.published || 0,
      draft: productsResponse.data?.statusCounts?.draft || 0,
      archived: productsResponse.data?.statusCounts?.archived || 0,
    };

    // Fetch interaction data
    const interactionResponse = await makePriorityRequest('get', `/users/${user._id}/interactions`);
    const interactionCounts = {
      bookmarks: interactionResponse.data?.bookmarkCount || 0,
      upvotes: interactionResponse.data?.upvoteCount || 0,
    };

    // Pass the data as props to the ProfilePage component
    return (
      <ProfilePage 
        initialUser={user}
        initialProducts={products}
        initialInteractionCounts={interactionCounts}
        initialStatusCounts={statusCounts}
        initialTotalPages={totalPages}
      />
    );
  } catch (error) {
    logger.error(`Failed to fetch profile data for ${username}:`, error);
    notFound();
  }
}
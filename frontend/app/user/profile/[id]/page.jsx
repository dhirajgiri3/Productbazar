import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import logger from '@/lib/utils/logger';

// This is a fallback page for when username is undefined
// It will redirect to the user's profile page if possible, or to the app home page

export default async function UserProfileFallbackPage({ params }) {
  const { id } = await params;
  
  try {
    // Get the access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    // If we have an ID but no access token, redirect to login
    if (!accessToken) {
      logger.warn(`No access token found for user ID: ${id}`);
      return redirect('/auth/login');
    }
    
    // Fetch the user data from the API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data?.username) {
      // If we have a username, redirect to the user's profile page
      return redirect(`/user/${data.data.username}`);
    }
    
    // If we don't have a username, redirect to the app home page
    return redirect('/app');
  } catch (error) {
    logger.error(`Error in UserProfileFallbackPage: ${error.message}`);
    return redirect('/app');
  }
}

import { ErrorPage } from "Components/UI/ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      title="404: Page Not Found"
      description="Sorry, we couldn't find the page you're looking for. It may have been moved, deleted, or you may have mistyped the address. Please check the URL or return to the homepage."
      errorCode="404"
      suggestion="If you believe this is an error, please contact support or use the navigation above to find what you need."
      showHomeButton={true}
    />
  );
}

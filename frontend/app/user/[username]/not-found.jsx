import { ErrorPage } from "Components/UI/ErrorPage";

export default function NotFound() {
  return (
    <ErrorPage
      title="User Not Found"
      description="The user profile you're looking for doesn't exist or has been removed."
      errorCode="404"
    />
  );
}

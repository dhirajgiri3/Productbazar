import { AuthProvider } from "@/lib/contexts/auth-context";

export const metadata = {
  title: 'Login - Navkar Selection',
  description: 'Login to your Navkar Selection account.',
};

export default function LoginLayout({ children }) {
  return (
    <div>
      <AuthProvider>{children}</AuthProvider>
    </div>
  );
}
     
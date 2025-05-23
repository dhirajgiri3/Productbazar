import dynamic from "next/dynamic";

// Import the CSS
import "./globals.css";

// Dynamically import the Landing component with no SSR
const Landing = dynamic(() => import("../Components/Landing/Landing"), {
  ssr: false,
});

export default function Page() {
  return (
    <div>
      <Landing />
    </div>
  );
}

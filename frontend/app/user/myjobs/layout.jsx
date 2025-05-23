import { JobProvider } from '@/lib/contexts/job-context';

export const metadata = {
  title: 'My Jobs - Product Bazar',
  description: 'Manage and view your job listings on Product Bazar.',
  keywords: 'my jobs, job management, Product Bazar, job listings',
};

export default function MyJobsLayout({ children }) {
  return (
    <div>
      <JobProvider>
        {children}
      </JobProvider>
    </div>
  );
}

import { redirect } from 'next/navigation';

// Root "/" is the dashboard home in the (dashboard) route group.
// Redirect to /clients as the default landing page.
export default function RootPage() {
  redirect('/clients');
}

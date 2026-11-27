import { redirect } from 'next/navigation';

export default function CollectionsPage() {
  // Redirect to the shop page (or any desired page)
  redirect('/shop');
  // The function never returns a React component because redirect throws.
  return null;
}

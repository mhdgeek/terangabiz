import { redirect } from 'next/navigation'

// Redirect immédiatement côté serveur — zéro spinner, zéro délai
export default function RootPage() {
  redirect('/dashboard')
}

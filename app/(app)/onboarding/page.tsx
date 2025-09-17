import { redirect } from 'next/navigation'

export default function OnboardingPage() {
  // The onboarding flow now lives in Ajustes to allow editing any time.
  redirect('/(app)/ajustes')
}

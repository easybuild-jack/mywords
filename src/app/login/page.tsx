import type { Metadata } from 'next'
import { LoginView } from '@/components/auth/LoginView'

export const metadata: Metadata = {
  title: '登录 · LinguaLoop',
}

export default function LoginPage() {
  return <LoginView />
}


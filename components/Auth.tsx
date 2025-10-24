
'use client'

/**
 * DEPRECATED: This component used Supabase Auth UI
 * Use /components/auth-form.tsx or /components/auth/AuthForm.tsx instead
 */
export default function AuthComponent() {
  return (
    <div className="p-6 text-center">
      <p className="text-gray-600">
        This authentication component has been migrated to NextAuth.
        Please use the sign in/sign up pages instead.
      </p>
    </div>
  )
}

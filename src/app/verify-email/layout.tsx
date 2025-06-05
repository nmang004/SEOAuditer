import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Verification - SEO Director',
  description: 'Verify your email address to complete your account setup',
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {children}
    </div>
  );
}
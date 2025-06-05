import VerificationPage from './verification';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function VerifyEmailPage({ params }: PageProps) {
  const { token } = await params;
  return <VerificationPage token={token} />;
}
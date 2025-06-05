import VerificationPage from './verification';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function VerifyEmailPage({ params }: PageProps) {
  const { token } = await params;
  
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Verification Link</h1>
          <p>No verification token provided.</p>
        </div>
      </div>
    );
  }
  
  return <VerificationPage token={token} />;
}
import VerificationPage from './verification';

interface PageProps {
  params: {
    token: string;
  };
}

export default function VerifyEmailPage({ params }: PageProps) {
  return <VerificationPage token={params.token} />;
}
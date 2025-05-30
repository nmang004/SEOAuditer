import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          
          <div className="space-y-6 text-sm">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Rival Outranker, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of Rival Outranker per device for personal, non-commercial transitory viewing only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Disclaimer</h2>
              <p>
                The materials on Rival Outranker are provided on an 'as is' basis. Rival Outranker makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Limitations</h2>
              <p>
                In no event shall Rival Outranker or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use Rival Outranker, even if Rival Outranker or a Rival Outranker authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Accuracy of Materials</h2>
              <p>
                The materials appearing on Rival Outranker could include technical, typographical, or photographic errors. Rival Outranker does not warrant that any of the materials on its website are accurate, complete, or current.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Links</h2>
              <p>
                Rival Outranker has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Modifications</h2>
              <p>
                Rival Outranker may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at support@rivaloutranker.com.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
} 
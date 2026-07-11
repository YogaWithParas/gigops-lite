import { PageHeader } from "@/components/page-header"
import { HowItWorksDiagram } from "@/components/how-it-works-diagram"
import { Card, CardContent } from "@/components/ui/card"

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="How It Works"
        description="A quick look at how work flows through GigOps Lite, from request to payout."
      />

      <Card>
        <CardContent className="p-5">
          <HowItWorksDiagram />
        </CardContent>
      </Card>
    </>
  )
}

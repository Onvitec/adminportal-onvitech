import LinearFlowForm from "@/components/forms/linear-flow/linear-flow-form";
import { sessionTypes } from "@/lib/types";

interface PageProps {
  params: Promise<{ type: string }>;
}

export default async function Page({ params }: PageProps) {
  const { type } = await params;
  
  if (type === sessionTypes.LINEAR_FLOW) {
    return <LinearFlowForm />;
  }
  return <div>My Post: {type}</div>;
}

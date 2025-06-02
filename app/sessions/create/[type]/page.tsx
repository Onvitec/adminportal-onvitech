import InteractiveSessionForm from "@/components/forms/interactive/interactive-flow-form";
import LinearSessionForm from "@/components/forms/linear-flow/linear-flow-form";
import { sessionTypes } from "@/lib/types";

interface PageProps {
  params: Promise<{ type: string }>;
}

export default async function Page({ params }: PageProps) {
  const { type } = await params;

  if (type === sessionTypes.INTERACTIVE) {
    return <InteractiveSessionForm />;
  } else if (type === sessionTypes.LINEAR_FLOW) {
    return <LinearSessionForm />;
  }else if(type === sessionTypes.SELECTION){
    return <div> Selection </div>
  }

  return <div>My Post: {type}</div>;
}

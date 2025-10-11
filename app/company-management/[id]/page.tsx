import React from "react";
import CompanyLeadsPage from "./company-lead-page";

// Next.js automatically injects params into this function
const Page = ({ params }: { params: { id: string } }) => {
  return (
    <div>
      <CompanyLeadsPage companyId={params.id} />
    </div>
  );
};

export default Page;

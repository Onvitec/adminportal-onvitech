import React from "react";
import CompanyLeadsPage from "./company-lead-page";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return (
    <div>
      <CompanyLeadsPage companyId={id} />
    </div>
  );
};

export default Page;

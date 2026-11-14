import { CampaignHeader } from "@/components/dashboard/CampaignHeader";

export default async function CampaignLayout({ children, params }: { children: React.ReactNode; params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  return (
    <>
      <CampaignHeader name={name} />
      <div className="mt-5">{children}</div>
    </>
  );
}

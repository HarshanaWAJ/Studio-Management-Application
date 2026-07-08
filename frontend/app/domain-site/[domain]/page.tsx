import PublicSitePage from "@/components/ui/PublicSitePage";

export default async function Page({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  return <PublicSitePage domain={domain} />;
}

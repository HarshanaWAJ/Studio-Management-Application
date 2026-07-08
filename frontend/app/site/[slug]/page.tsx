import PublicSitePage from "@/components/ui/PublicSitePage";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicSitePage slug={slug} />;
}

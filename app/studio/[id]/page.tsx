import { SoftFlashJobDetail, StudioJobDetail } from "../../../components/effect-lab-app";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return id === "soft-flash-test" ? <SoftFlashJobDetail/> : <StudioJobDetail/>;
}

import Hoodwinked from "./hoodwinked";
import { auth } from "@/auth";
import { getHostAccess } from "@/lib/host-access";

export default async function HoodwinkedPage() {
  const hostAccess = getHostAccess(await auth());
  return <Hoodwinked hostAccess={hostAccess} />;
}

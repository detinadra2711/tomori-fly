import { listAirlines, listCities } from "@/lib/master-data/queries";
import { MasterDataManager } from "./MasterDataManager";

export default async function AdminMasterDataPage() {
  const [airlines, cities] = await Promise.all([listAirlines(), listCities()]);
  return <MasterDataManager airlines={airlines} cities={cities} />;
}

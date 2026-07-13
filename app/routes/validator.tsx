import type { Route } from "./+types/validator";
import { fetchValidator, fetchChainData } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import { ValidatorProfile } from "@/components/ValidatorProfile";

export async function loader({ params }: Route.LoaderArgs) {
  const { network, address } = params;

  let validator;
  try {
    const res = await fetchValidator(network, address);
    validator = res.data;
  } catch {
    throw new Response("Validator not found", { status: 404 });
  }

  // chain-data is account-gated upstream → 401 anonymously; degrade to null.
  const chainData = await fetchChainData(network, address)
    .then((r) => r?.data ?? null)
    .catch(() => null);

  return { validator, chainData };
}

export function meta({ loaderData, params }: Route.MetaArgs) {
  const name = loaderData?.validator?.moniker?.trim() || params.address;
  const net = params.network;
  const count = loaderData?.validator?.events?.length ?? 0;
  return pageMeta({
    title: `${name} · ${net} · slashr`,
    description: `${count} recorded incident${count === 1 ? "" : "s"} for ${name} on ${net}. Risk signals and event history on slashr.`,
    canonical: `https://slashr.dev/validator/${net}/${params.address}`,
    // OG image falls back to the static card until satori's workerd build's
    // WOFF-decode is sorted (needs TTF/OTF); the /og route stays for that fix.
  });
}

export default function ValidatorRoute({ loaderData }: Route.ComponentProps) {
  return (
    <ValidatorProfile
      validator={loaderData.validator}
      chainData={loaderData.chainData}
      loading={false}
      error={null}
    />
  );
}

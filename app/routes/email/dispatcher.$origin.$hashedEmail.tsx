import { LoaderFunction, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { Feature, redis } from "~/redis.server";

export const loader: LoaderFunction = async ({ params }) => {
  const { origin, hashedEmail } = params;

  invariant(
    typeof origin === "string",
    "Expected 'origin' to be included in params."
  );
  invariant(
    typeof hashedEmail === "string",
    "Expected 'hashedEmail' to be included in params."
  );
  invariant(
    ["registrieren", "anmelden"].includes(origin),
    "Expected origin to be 'registrieren' or 'anmelden'."
  );

  const stringifiedData = await redis.get(Feature.MESSAGE_ID, hashedEmail);
  const messageId = stringifiedData && JSON.parse(stringifiedData)?.messageId;

  if (!messageId) {
    console.log("No messageId found in Redis. Cannot show email status.");
  }

  return redirect(
    `/email/status/${origin}/${hashedEmail}/${messageId ? messageId : "none"}`
  );
};

export default function EmailDispatcher() {
  return null;
}

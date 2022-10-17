import { json, LoaderFunction, MetaFunction, redirect } from "@remix-run/node";
import { authenticator } from "~/auth.server";
import { pageTitle } from "~/util/pageTitle";
import { useId } from "~/useid/useid";
import { useLoaderData } from "@remix-run/react";
import {
  BreadcrumbNavigation,
  Button,
  ButtonContainer,
  ContentContainer,
  Headline,
  SectionLabel,
} from "~/components";
import invariant from "tiny-invariant";
import Bolt from "~/components/icons/mui/Bolt";

export const meta: MetaFunction = () => {
  return { title: pageTitle("Identifizieren Sie sich mit Ihrem Ausweis") };
};

export const loader: LoaderFunction = async ({ request }) => {
  if (process.env.USE_USE_ID !== "true") {
    throw new Response("Not Found", {
      status: 404,
    });
  }
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/anmelden",
  });
  if (user.identified) {
    return redirect("/formular");
  }
  const tcTokenUrl = await useId.getTcTokenUrl();
  invariant(tcTokenUrl, "Expected to receive a tcTokenUrl from useId");
  console.log("Started bundesIdent flow");
  return json(
    {
      host: new URL(request.url).hostname,
      widgetSrc: useId.getWidgetSrc(),
      tcTokenUrl: await useId.getTcTokenUrl(),
      useIdDomain: process.env.USEID_DOMAIN,
    },
    {}
  );
};

export default function BundesidIndex() {
  const { tcTokenUrl, useIdDomain, host } = useLoaderData();
  return (
    <>
      <SectionLabel
        icon={<Bolt className="mr-4" />}
        background="yellow"
        className="mb-16"
      >
        Beta-Status
      </SectionLabel>
      <Headline>
        Identifizieren Sie sich mit Ihrem Ausweis und der BundesIdent App
      </Headline>

      <iframe
        src={`${useIdDomain}/widget?hostname=${host}#tcTokenURL=${encodeURIComponent(
          tcTokenUrl
        )}`}
        style={{ width: "100%", minHeight: "600px" }}
      />
      <ButtonContainer className="mt-16">
        <Button look={"secondary"} to="/bundesident/disclaimer">
          Zurück zur Voraussetzung
        </Button>
      </ButtonContainer>
    </>
  );
}

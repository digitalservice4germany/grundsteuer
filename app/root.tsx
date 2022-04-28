import { LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useMatches,
} from "@remix-run/react";
import { i18Next } from "~/i18n.server";
import { useSetupTranslations } from "remix-i18next";
import { pageTitle } from "~/util/pageTitle";
import styles from "public/tailwind.css";
import ogImage from "~/assets/images/og-image.png";
import { Spinner } from "./components";

export const links: LinksFunction = () => {
  return [
    {
      rel: "preload",
      as: "font",
      href: "/fonts/BundesSansWeb-Regular.woff2",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      as: "font",
      href: "/fonts/BundesSansWeb-Bold.woff2",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    { rel: "stylesheet", href: styles },
    { rel: "icon", sizes: "any", href: "/favicon.ico" },
    { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    { rel: "manifest", href: "/site.webmanifest" },
  ];
};

export const meta: MetaFunction = () => {
  const title = pageTitle(null);
  const description =
    "Mit dem Online-Service, entwickelt im Auftrag des Bundesfinanzministeriums, können Privateigentümer:innen ihre Grundsteuererklärung einfach und kostenlos abgeben.";
  return {
    title,
    description,
    viewport: "width=device-width,initial-scale=1",
    "og:image": `https://www.grundsteuererklaerung-fuer-privateigentum.de${ogImage}`,
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:site_name":
      "Grundsteuererklärung für Privateigentum. Schnell. Unkompliziert. Kostenlos.",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:card": "summary_large_image",
    "twitter:site": "@DigitalServ4Ger",
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  return {
    i18n: await i18Next.getTranslations(request, ["all"]),
    env: process.env.APP_ENV,
  };
};

export function ErrorBoundary({ error }: { error: Error }) {
  if (typeof document === "undefined") {
    // log only in server, never in browser
    console.error(error);
  }
  return (
    <html>
      <head>
        <title>Oh nein!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <h1>Da ist etwas schiefgelaufen :(</h1>
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const loaderData = useLoaderData();
  useSetupTranslations("de");
  const matches = useMatches();

  const fscBeantragenMatch = matches.filter(
    (match) => match.id === "routes/fsc/beantragen/index"
  )[0];
  const showSpinner = fscBeantragenMatch?.data?.showSpinner;

  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
        {loaderData?.env === "production" && (
          <script
            defer
            data-domain="grundsteuererklaerung-fuer-privateigentum.de"
            src="https://plausible.io/js/plausible.js"
          ></script>
        )}
      </head>
      <body className="flex flex-col min-h-screen text-black bg-gray-100 leading-default">
        <Outlet />
        {showSpinner && <Spinner />}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

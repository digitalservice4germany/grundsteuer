import {
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { useChangeLanguage } from "remix-i18next";
import { pageTitle } from "~/util/pageTitle";
import styles from "public/tailwind.css";
import ogImage from "~/assets/images/og-image.png";

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

interface LoaderData {
  env: string;
  sentry_dsn: string;
}

export const loader: LoaderFunction = async () => {
  return json<LoaderData>({
    env: process.env.APP_ENV as string,
    sentry_dsn: process.env.SENTRY_DSN as string,
  });
};

export const handle = {
  i18n: ["all"],
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
  const { env, sentry_dsn } = useLoaderData();
  useChangeLanguage("de");

  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
        {env === "production" && (
          <script
            defer
            data-domain="grundsteuererklaerung-fuer-privateigentum.de"
            src="https://plausible.io/js/plausible.js"
            crossOrigin="anonymous"
          ></script>
        )}
      </head>
      <body className="flex flex-col min-h-screen text-black bg-gray-100 leading-default">
        <Outlet />
        <ScrollRestoration />
        {sentry_dsn && (
          <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `window.sentry_dsn="${sentry_dsn}";`,
            }}
          />
        )}
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

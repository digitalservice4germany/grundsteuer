import { LoaderFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { getStoredFormData } from "~/formDataStorage.server";
import {
  Button,
  Footer,
  FormSidebarNavigation,
  SidebarNavigation,
  Layout,
  LogoutButton,
  Main,
} from "~/components";
import { createGraph } from "~/domain";
import { getCurrentStateFromUrl } from "~/util/getCurrentState";
import { authenticator } from "~/auth.server";
import { useState } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/anmelden",
  });
  const storedFormData = await getStoredFormData({ request, user });

  const graph = createGraph({
    machineContext: storedFormData,
  });

  return {
    graph,
    currentState: getCurrentStateFromUrl(request.url),
    userIsIdentified: user.identified,
  };
};

export default function Formular() {
  const { graph, currentState, userIsIdentified } = useLoaderData();

  const [showMobileNavigation, setShowMobileNavigation] = useState(false);

  return (
    <Layout
      footer={<Footer />}
      sidebarNavigation={
        <SidebarNavigation
          userIsIdentified={userIsIdentified}
          userIsLoggedIn={true}
        >
          <FormSidebarNavigation
            graph={graph}
            initialCurrentState={currentState}
          />
        </SidebarNavigation>
      }
      topNavigation={
        <div className="p-4 bg-blue-100">
          <Link to="/">Home</Link>
          <LogoutButton />
          <Button
            size="small"
            look="tertiary"
            onClick={() => setShowMobileNavigation(!showMobileNavigation)}
          >
            Toggle Navigation
          </Button>
          {showMobileNavigation && (
            <>
              <br />
              <br />
              <FormSidebarNavigation
                graph={graph}
                initialCurrentState={currentState}
              />
            </>
          )}
        </div>
      }
    >
      <Main>
        <Outlet />
      </Main>
    </Layout>
  );
}

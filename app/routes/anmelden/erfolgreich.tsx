import { LoaderFunction, MetaFunction, redirect } from "@remix-run/node";
import {
  BreadcrumbNavigation,
  Button,
  ContentContainer,
  Headline,
  IntroText,
  SuccessPageLayout,
  UserLayout,
} from "~/components";
import { pageTitle } from "~/util/pageTitle";
import { authenticator } from "~/auth.server";
import { useLoaderData } from "@remix-run/react";
import { flags } from "~/flags.server";
import { rememberCookie } from "~/storage/rememberLogin.server";
import { findUserByEmail, User } from "~/domain/user";
import invariant from "tiny-invariant";
import {
  canEnterFsc,
  fscIsOlderThanOneDay,
  fscIsTooOld,
  needsToStartIdentification,
} from "~/domain/identificationStatus";

export const meta: MetaFunction = () => {
  return { title: pageTitle("Erfolgreich angemeldet.") };
};

const getNextStepUrl = (user: User) => {
  if (!user.inDeclarationProcess) return "/formular/erfolg";
  if (needsToStartIdentification(user)) return "/identifikation";
  return "/formular";
};

const getFscStepUrl = (user: User) => {
  if (!canEnterFsc(user)) return;
  if (fscIsTooOld(user)) return "/fsc/eingeben";
  if (fscIsOlderThanOneDay(user)) return "/fsc/eingeben";
};

export const loader: LoaderFunction = async ({ request }) => {
  const sessionUser = await authenticator.isAuthenticated(request, {
    failureRedirect: "/anmelden",
  });

  // save the "remember login" cookie
  const URL_PARAM_NAME_WHEN_COOKIE_IS_SET = "r";
  const currentUrl = new URL(request.url);
  const cookieIsSet = currentUrl.searchParams.get(
    URL_PARAM_NAME_WHEN_COOKIE_IS_SET
  );

  if (!cookieIsSet) {
    const redirectUrl = `${currentUrl.pathname}?${URL_PARAM_NAME_WHEN_COOKIE_IS_SET}=1`;
    return redirect(redirectUrl, {
      headers: { "Set-Cookie": await rememberCookie() },
    });
  }

  const user: User | null = await findUserByEmail(sessionUser.email);
  invariant(
    user,
    "expected a matching user in the database from a user in a cookie session"
  );

  return {
    email: sessionUser.email,
    nextStepUrl: getNextStepUrl(user),
    fscStepUrl: getFscStepUrl(user),
    flags: flags.getAllFlags(),
  };
};
export default function ErfolgreichAngemeldet() {
  const { email, nextStepUrl, fscStepUrl, flags } = useLoaderData();

  return (
    <UserLayout email={email} flags={flags}>
      <ContentContainer size="sm">
        <BreadcrumbNavigation />
        <SuccessPageLayout>
          <Headline> Sie haben sich erfolgreich angemeldet. </Headline>
          <IntroText>
            Sie können die Bearbeitung jederzeit unterbrechen und fortführen.
          </IntroText>

          <IntroText className="mb-80">
            Bitte beachten Sie, das dies nur am Gerät und Browser möglich ist,
            in dem Sie sich registriert haben.
          </IntroText>

          <Button data-testid="continue" to={nextStepUrl}>
            Verstanden & weiter
          </Button>

          {fscStepUrl && (
            <div className="mt-80">
              <h2 className="mb-32 text-30 leading-36">
                Sie haben einen Freischaltcode beantragt, um sich zu
                identifizieren.
              </h2>
              <IntroText>
                Geben Sie Ihren Freischaltcode jetzt ein oder erhalten Sie Hilfe
                zu dem Thema
              </IntroText>
              <Button data-testid="continue-fsc" to={fscStepUrl}>
                Zum Freischaltcode
              </Button>
            </div>
          )}
        </SuccessPageLayout>
      </ContentContainer>
    </UserLayout>
  );
}

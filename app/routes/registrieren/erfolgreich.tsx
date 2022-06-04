import { MetaFunction } from "@remix-run/node";
import {
  BreadcrumbNavigation,
  ContentContainer,
  Headline,
  IntroText,
  UserLayout,
  SuccessPageLayout,
} from "~/components";
import { pageTitle } from "~/util/pageTitle";

export const meta: MetaFunction = () => {
  return { title: pageTitle("Registrierung erfolgreich") };
};

export default function RegistrierenErfolgreich() {
  return (
    <UserLayout>
      <ContentContainer size="sm">
        <BreadcrumbNavigation />
        <SuccessPageLayout>
          <Headline>Konto erfolgreich erstellt.</Headline>
          <IntroText>
            Sie haben erfolgreich ein Konto erstellt. Merken Sie sich bitte die
            verwendete E-Mail-Adresse.
          </IntroText>
          <IntroText className="!mb-80">
            Wir haben Ihnen eine E-Mail gesendet.
            <br />
            Bitte klicken Sie auf den Anmeldelink in der E-Mail.
          </IntroText>
        </SuccessPageLayout>
      </ContentContainer>
    </UserLayout>
  );
}

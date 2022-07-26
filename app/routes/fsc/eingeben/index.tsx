import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
  Session,
} from "@remix-run/node";
import {
  BreadcrumbNavigation,
  Button,
  ButtonContainer,
  ContentContainer,
  FormGroup,
  Headline,
  IntroText,
  Spinner,
} from "~/components";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import { getErrorMessageForFreischaltcode } from "~/domain/validation";
import { removeUndefined } from "~/util/removeUndefined";
import {
  activateFreischaltCode,
  checkFreischaltcodeActivation,
} from "~/erica/freischaltCodeAktivieren";
import {
  deleteEricaRequestIdFscAktivieren,
  deleteEricaRequestIdFscStornieren,
  deleteFscRequest,
  findUserByEmail,
  saveEricaRequestIdFscAktivieren,
  saveEricaRequestIdFscStornieren,
  setUserIdentified,
  User,
} from "~/domain/user";
import { authenticator } from "~/auth.server";
import { commitSession, getSession } from "~/session.server";
import { useEffect, useState } from "react";
import FreischaltCodeInput from "~/components/FreischaltCodeInput";
import {
  checkFreischaltcodeRevocation,
  revokeFreischaltCode,
} from "~/erica/freischaltCodeStornieren";
import ErrorBar from "~/components/ErrorBar";
import { AuditLogEvent, saveAuditLog } from "~/audit/auditLog";
import { createCsrfToken, CsrfToken, verifyCsrfToken } from "~/util/csrf";
import FreischaltcodeHelp from "~/components/form/help/Freischaltcode";
import ArrowRight from "~/components/icons/mui/ArrowRight";
import { testFeaturesEnabled } from "~/util/testFeaturesEnabled";

const isEricaRequestInProgress = async (userData: User) => {
  return (
    isEricaActivationRequestInProgress(userData) ||
    isEricaRevocationRequestInProgress(userData)
  );
};

const isEricaActivationRequestInProgress = async (userData: User) => {
  return Boolean(userData.ericaRequestIdFscAktivieren);
};

export const isEricaRevocationRequestInProgress = async (userData: User) => {
  return Boolean(userData.ericaRequestIdFscStornieren);
};

const wasEricaRequestSuccessful = async (userData: User) => {
  return (
    userData.identified && !(await isEricaRevocationRequestInProgress(userData))
  );
};

const getEricaRequestIdFscAktivieren = async (userData: User) => {
  invariant(
    userData.ericaRequestIdFscAktivieren,
    "ericaRequestIdFscAktivieren is null"
  );
  return userData.ericaRequestIdFscAktivieren;
};

export const revokeFsc = async (userData: User) => {
  invariant(userData.fscRequest, "expected an fscRequest in database for user");
  const ericaRequestId = await revokeFreischaltCode(
    userData.fscRequest?.requestId
  );
  await saveEricaRequestIdFscStornieren(userData.email, ericaRequestId);
};

const handleFscActivationProgress = async (
  userData: User,
  session: Session,
  clientIp: string,
  successLoggingMessage?: string
) => {
  const fscActivatedOrError = await checkFreischaltcodeActivation(
    await getEricaRequestIdFscAktivieren(userData)
  );
  if (fscActivatedOrError) {
    if ("transferticket" in fscActivatedOrError) {
      await setUserIdentified(userData.email, true);
      session.set(
        "user",
        Object.assign(session.get("user"), { identified: true })
      );
      await deleteEricaRequestIdFscAktivieren(userData.email);
      await saveAuditLog({
        eventName: AuditLogEvent.FSC_ACTIVATED,
        timestamp: Date.now(),
        ipAddress: clientIp,
        username: userData.email,
        eventData: {
          transferticket: fscActivatedOrError.transferticket,
        },
      });
      console.log(`${successLoggingMessage}`);

      await revokeFsc(userData);
    } else if (fscActivatedOrError?.errorType == "EricaUserInputError") {
      await deleteEricaRequestIdFscAktivieren(userData.email);
      return {
        showError: true,
        showSpinner: false,
      };
    } else {
      await deleteEricaRequestIdFscAktivieren(userData.email);
      throw new Error(
        `${fscActivatedOrError?.errorType}: ${fscActivatedOrError?.errorMessage}`
      );
    }
  }
};

const getEricaRequestIdFscStornieren = async (userData: User) => {
  invariant(
    userData.ericaRequestIdFscStornieren,
    "ericaRequestIdFscStornieren is null"
  );
  return userData.ericaRequestIdFscStornieren;
};

export const handleFscRevocationInProgress = async (
  userData: User,
  clientIp: string,
  successLoggingMessage?: string
) => {
  const fscRevocatedOrError = await checkFreischaltcodeRevocation(
    await getEricaRequestIdFscStornieren(userData)
  );
  if (fscRevocatedOrError) {
    if ("transferticket" in fscRevocatedOrError) {
      invariant(userData.fscRequest, "expected fscRequest to be present");
      await deleteFscRequest(userData.email, userData.fscRequest.requestId);
      await deleteEricaRequestIdFscStornieren(userData.email);
      await saveAuditLog({
        eventName: AuditLogEvent.FSC_REVOKED,
        timestamp: Date.now(),
        ipAddress: clientIp,
        username: userData.email,
        eventData: {
          transferticket: fscRevocatedOrError.transferticket,
        },
      });
      console.log(`${successLoggingMessage}`);
      return { finished: true };
    } else if (fscRevocatedOrError?.errorType == "EricaUserInputError") {
      await deleteEricaRequestIdFscStornieren(userData.email);
      return {
        finished: true,
        showError: true,
        showSpinner: false,
      };
    } else {
      await deleteEricaRequestIdFscStornieren(userData.email);
      return { finished: true };
    }
  }
};

export const loader: LoaderFunction = async ({ request, context }) => {
  const { clientIp } = context;
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/anmelden",
  });
  const userData: User | null = await findUserByEmail(user.email);
  invariant(
    userData,
    "expected a matching user in the database from a user in a cookie session"
  );

  const ericaActivationRequestIsInProgress =
    await isEricaActivationRequestInProgress(userData);
  const ericaRevocationRequestIsInProgress =
    await isEricaRevocationRequestInProgress(userData);

  if (await wasEricaRequestSuccessful(userData)) {
    return redirect("/fsc/eingeben/erfolgreich");
  }

  const session = await getSession(request.headers.get("Cookie"));

  if (ericaActivationRequestIsInProgress) {
    const fscActivationData = await handleFscActivationProgress(
      userData,
      session,
      clientIp,
      `FSC activated for user with id ${userData?.id}`
    );
    if (fscActivationData) {
      return fscActivationData;
    }
  }

  if (ericaRevocationRequestIsInProgress) {
    // We only try to revocate. If it does not succeed, we do not want to show an error to the user
    await handleFscRevocationInProgress(
      userData,
      clientIp,
      `FSC revoked after activation for user with id ${userData.id}`
    );
  }

  const csrfToken = createCsrfToken(session);

  return json(
    {
      csrfToken,
      showError: false,
      showSpinner:
        ericaActivationRequestIsInProgress ||
        ericaRevocationRequestIsInProgress,
      showNewIdent: testFeaturesEnabled,
    },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};

export const action: ActionFunction = async ({ request }) => {
  await verifyCsrfToken(request);
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/anmelden",
  });
  const userData: User | null = await findUserByEmail(user.email);
  invariant(
    userData,
    "expected a matching user in the database from a user in a cookie session"
  );
  invariant(userData.fscRequest, "expected an fscRequest in database for user");
  const elsterRequestId = userData.fscRequest.requestId;

  if (await wasEricaRequestSuccessful(userData)) {
    return redirect("/fsc/eingeben/erfolgreich");
  }

  if (await isEricaRequestInProgress(userData)) return {};

  const formData = await request.formData();
  const freischaltCode = formData.get("freischaltCode");

  invariant(
    typeof freischaltCode === "string",
    "expected formData to include freischaltCode field of type string"
  );

  const errors = {
    freischaltCode: await getErrorMessageForFreischaltcode(freischaltCode),
  };

  const errorsExist = errors.freischaltCode;

  if (errorsExist) {
    return json({
      errors: removeUndefined(errors),
    });
  }

  const ericaRequestId = await activateFreischaltCode(
    freischaltCode,
    elsterRequestId
  );
  await saveEricaRequestIdFscAktivieren(user.email, ericaRequestId);

  return {};
};

export default function FscEingeben() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const errors = actionData?.errors;

  // We need to fetch data to check the result with Elster
  const fetcher = useFetcher();
  const transition = useTransition();
  const isSubmitting = Boolean(transition.submission);

  const [showSpinner, setShowSpinner] = useState(loaderData?.showSpinner);
  const [showError, setShowError] = useState(loaderData?.showError);
  const [fetchInProgress, setFetchInProgress] = useState(false);

  useEffect(() => {
    if (fetcher.data) {
      setShowSpinner(fetcher.data.showSpinner);
      setShowError(fetcher.data.showError);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (loaderData) {
      setShowSpinner(loaderData.showSpinner);
      setShowError(loaderData.showError);
    }
  }, [loaderData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (showSpinner && !fetchInProgress) {
        setFetchInProgress(true);
        fetcher.load("/fsc/eingeben?index");
        setFetchInProgress(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [fetcher, showSpinner]);

  return (
    <ContentContainer size="sm">
      <BreadcrumbNavigation />
      <Headline>Bitte geben Sie Ihren Freischaltcode ein</Headline>
      <IntroText>
        Wir haben einen Freischaltcode für Sie beantragt. Dieser wird per Post
        innerhalb von 7 - 14 Tagen an Ihre Adresse versendet. Nach Erhalt des
        Briefes, finden Sie den Freischaltcode auf der letzten Seite. Er besteht
        aus 12 Zeichen.
      </IntroText>

      {showError && !isSubmitting && (
        <ErrorBar className="mb-32">
          Der eingegebene Freischaltcode ist nicht gültig. Sie haben insgesamt 5
          Versuche. Danach müssen Sie einen neuen Freischaltcode beantragen.
        </ErrorBar>
      )}

      <Form method="post" action={"/fsc/eingeben?index"}>
        <CsrfToken value={loaderData.csrfToken} />
        <div>
          <FormGroup>
            <FreischaltCodeInput
              name="freischaltCode"
              label="Freischaltcode"
              placeholder="XXXX-XXXX-XXXX"
              error={errors?.freischaltCode}
              help={<FreischaltcodeHelp />}
            />
          </FormGroup>
        </div>
        <ButtonContainer>
          <Button disabled={isSubmitting || showSpinner}>
            Freischaltcode speichern
          </Button>
          <Button look="secondary" to="/formular/zusammenfassung">
            Zurück zur Übersicht
          </Button>
        </ButtonContainer>
      </Form>
      <h2 className="mt-80 mb-32 text-24 font-bold">
        Keinen Freischaltcode erhalten?
      </h2>
      <p className="mb-32">
        Zwei Wochen sind um und Sie haben noch keinen Brief mit dem
        Freischaltcode erhalten?
      </p>
      <div className="flex items-center mb-48">
        <ArrowRight className="inline-block mr-16" />
        <a
          href="/fsc/neuBeantragen?index"
          className="font-bold underline text-18 text-blue-800"
        >
          Freischaltcode neu beantragen
        </a>
      </div>
      {loaderData.showNewIdent && (
        <>
          <p className="mb-32">
            Personen mit einem ELSTER Konto erhalten in der Regel keinen Brief
            mit einem Freischaltcode. Sie können Ihre ELSTER Zugangsdaten
            nutzen, um sich zu identifizieren.
          </p>
          <div className="flex items-center">
            <ArrowRight className="inline-block mr-16" />
            <a
              href={"/ekona?index"}
              className="font-bold underline text-18 text-blue-800"
            >
              Mit ELSTER Zugang identifizieren
            </a>
          </div>
        </>
      )}

      {showSpinner && (
        <Spinner
          initialText={"Ihr Freischaltcode wird überprüft."}
          waitingText={
            "Das Überprüfen dauert gerade leider etwas länger. Bitte verlassen Sie diese Seite nicht."
          }
          longerWaitingText={
            "Wir überprüfen weiter Ihren Freischaltcode. Bitte verlassen Sie diese Seite nicht."
          }
        />
      )}
    </ContentContainer>
  );
}

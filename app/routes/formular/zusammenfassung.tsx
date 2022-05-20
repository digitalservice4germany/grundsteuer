import {
  ActionFunction,
  json,
  LoaderFunction,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import {
  createHeadersWithFormDataCookie,
  getStoredFormData,
} from "~/formDataStorage.server";
import { GrundModel, StepDefinition } from "~/domain/steps";
import { pageTitle } from "~/util/pageTitle";
import {
  filterDataForReachablePaths,
  getStepData,
  setStepData,
  StepFormData,
} from "~/domain/model";
import { zusammenfassung } from "~/domain/steps/zusammenfassung";
import { Button, Headline, Spinner, StepFormField } from "~/components";
import { authenticator } from "~/auth.server";
import { getFieldProps } from "~/util/getFieldProps";
import {
  validateAllStepsData,
  validateStepFormData,
} from "~/domain/validation";
import { getStepI18n, I18nObject } from "~/i18n/getStepI18n";
import ZusammenfassungAccordion from "~/components/form/ZusammenfassungAccordion";
import { removeUndefined } from "~/util/removeUndefined";
import { retrieveResult, sendNewGrundsteuer } from "~/erica/sendGrundsteuer";
import { transforDataToEricaFormat } from "~/erica/transformData";
import {
  deleteEricaRequestIdSenden,
  findUserByEmail,
  saveEricaRequestIdSenden,
  savePdf,
  saveTransferticket,
  User,
} from "~/domain/user";
import invariant from "tiny-invariant";
import { useEffect, useState } from "react";
import { EricaError } from "~/erica/utils";
import ErrorBar from "~/components/ErrorBar";
import { AuditLogEvent, saveAuditLog } from "~/audit/auditLog";
import Send from "~/components/icons/mui/Send";
import Attention from "~/components/icons/mui/Attention";
import { CsrfToken, verifyCsrfToken } from "~/util/csrf";
import { getSession } from "~/session.server";

type LoaderData = {
  formData: StepFormData;
  allData: GrundModel;
  i18n: I18nObject;
  stepDefinition: StepDefinition;
  isIdentified: boolean;
  previousStepsErrors: PreviousStepsErrors;
  ericaErrors: string[];
  showSpinner: boolean;
};

export const getEricaErrorMessagesFromResponse = (
  errorResponse: EricaError
): string[] => {
  if (errorResponse.errorType == "ERIC_GLOBAL_PRUEF_FEHLER") {
    const validationErrorMessage =
      "Es sind Validierungsfehler bei Elster aufgetreten. Bitte prüfen Sie Ihre Angaben.";
    return errorResponse.validationErrors
      ? [validationErrorMessage, ...errorResponse.validationErrors]
      : [validationErrorMessage];
  }
  if (
    [
      "ERIC_GLOBAL_BUFANR_UNBEKANNT",
      "INVALID_BUFA_NUMBER",
      "INVALID_TAX_NUMBER",
      "ERIC_GLOBAL_STEUERNUMMER_UNGUELTIG",
      "ERIC_GLOBAL_EWAZ_UNGUELTIG",
    ].includes(errorResponse.errorType)
  ) {
    const steuernummerInvalidMessage =
      "Es scheint ein Problem mit Ihrer angegebenen Steuernummer/Aktenzeichen gegeben zu haben. Bitte prüfen Sie Ihre Angaben.";
    return [steuernummerInvalidMessage];
  }
  throw Error("Unexpected Error: " + errorResponse.errorType);
};

export const saveConfirmationAuditLogs = async (
  clientIp: string,
  email: string,
  data: GrundModel
) => {
  invariant(
    data.zusammenfassung?.confirmCompleteCorrect == "true",
    "confirmCompleteCorrect should be checked"
  );
  invariant(
    data.zusammenfassung?.confirmDataPrivacy == "true",
    "confirmDataPrivacy should be checked"
  );
  invariant(
    data.zusammenfassung?.confirmTermsOfUse == "true",
    "confirmTermsOfUse should be checked"
  );

  await saveAuditLog({
    eventName: AuditLogEvent.CONFIRMED_COMPLETE_CORRECT,
    timestamp: Date.now(),
    ipAddress: clientIp,
    username: email,
    eventData: {
      value: data.zusammenfassung.confirmCompleteCorrect,
    },
  });
  await saveAuditLog({
    eventName: AuditLogEvent.CONFIRMED_DATA_PRIVACY,
    timestamp: Date.now(),
    ipAddress: clientIp,
    username: email,
    eventData: {
      value: data.zusammenfassung.confirmDataPrivacy,
    },
  });
  await saveAuditLog({
    eventName: AuditLogEvent.CONFIRMED_TERMS_OF_USE,
    timestamp: Date.now(),
    ipAddress: clientIp,
    username: email,
    eventData: {
      value: data.zusammenfassung.confirmTermsOfUse,
    },
  });
};

export const loader: LoaderFunction = async ({
  request,
  context,
}): Promise<LoaderData | Response> => {
  const { clientIp } = context;
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/anmelden",
  });
  const userData: User | null = await findUserByEmail(user.email);
  invariant(
    userData,
    "expected a matching user in the database from a user in a cookie session"
  );

  const storedFormData = await getStoredFormData({ request, user });
  const filteredData = filterDataForReachablePaths(storedFormData);
  const cleanedData = removeUndefined(filteredData);

  const previousStepsErrors = await validateAllStepsData(cleanedData);

  // Query Erica result
  let ericaErrors: string[] = [];
  let ericaRequestId = userData.ericaRequestIdSenden;
  if (ericaRequestId) {
    const successResponseOrErrors = await retrieveResult(ericaRequestId);
    if (successResponseOrErrors) {
      if ("pdf" in successResponseOrErrors) {
        await deleteEricaRequestIdSenden(user.email);
        await saveTransferticket(
          user.email,
          successResponseOrErrors.transferticket
        );
        await savePdf(user.email, successResponseOrErrors.pdf);
        await saveAuditLog({
          eventName: AuditLogEvent.TAX_DECLARATION_SENT,
          timestamp: Date.now(),
          ipAddress: clientIp,
          username: userData.email,
          eventData: { transferticket: successResponseOrErrors.transferticket },
        });
        return redirect("/formular/erfolg");
      } else {
        await deleteEricaRequestIdSenden(user.email);
        ericaRequestId = null;
        ericaErrors = getEricaErrorMessagesFromResponse(
          successResponseOrErrors
        );
      }
    }
  }

  return {
    formData: getStepData(storedFormData, "zusammenfassung"),
    allData: cleanedData,
    i18n: await getStepI18n("zusammenfassung"),
    stepDefinition: zusammenfassung,
    isIdentified: userData.identified,
    previousStepsErrors,
    ericaErrors,
    showSpinner: !!ericaRequestId,
  };
};

export type PreviousStepsErrors = {
  [key: string]: PreviousStepsErrors | string;
};

export type ActionData = {
  errors?: Record<string, string>;
  previousStepsErrors?: PreviousStepsErrors;
};

export const action: ActionFunction = async ({
  request,
  context,
}): Promise<ActionData | Response> => {
  const { clientIp } = context;
  const session = await getSession(request.headers.get("Cookie"));
  await verifyCsrfToken(request, session);

  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/anmelden",
  });

  if (!user.identified) throw new Error("user not identified!");

  const storedFormData = await getStoredFormData({ request, user });

  // validate this step's data
  const zusammenfassungFormData = Object.fromEntries(
    await request.formData()
  ) as unknown as StepFormData;
  const errors = await validateStepFormData(
    "zusammenfassung",
    zusammenfassungFormData,
    storedFormData
  );
  if (Object.keys(errors).length > 0) return { errors };

  // store
  const formDataToBeStored = setStepData(
    storedFormData,
    "zusammenfassung",
    zusammenfassungFormData
  );

  const headers = await createHeadersWithFormDataCookie({
    data: formDataToBeStored,
    user,
  });

  // validate all steps' data
  const previousStepsErrors = await validateAllStepsData(formDataToBeStored);
  if (Object.keys(previousStepsErrors).length > 0) {
    return json({ previousStepsErrors: previousStepsErrors }, { headers });
  }

  await saveConfirmationAuditLogs(clientIp, user.email, formDataToBeStored);

  // Send to Erica
  const transformedData = transforDataToEricaFormat(
    filterDataForReachablePaths(formDataToBeStored)
  );
  const ericaRequestId = await sendNewGrundsteuer(transformedData);
  await saveEricaRequestIdSenden(user.email, ericaRequestId);

  return json({}, { headers });
};

export const meta: MetaFunction = () => {
  return { title: pageTitle("Zusammenfassung Ihrer Eingaben") };
};

export default function Zusammenfassung() {
  const loaderData = useLoaderData<LoaderData>();
  const { formData, allData, i18n, stepDefinition, isIdentified } = loaderData;
  const actionData = useActionData();
  const errors = actionData?.errors;
  const previousStepsErrors =
    loaderData.previousStepsErrors || actionData?.previousStepsErrors;

  const fieldProps = getFieldProps(stepDefinition, formData, i18n, errors);

  // We need to fetch data to check the result with Elster
  const fetcher = useFetcher();
  const [showSpinner, setShowSpinner] = useState(loaderData.showSpinner);
  const [ericaErrors, setEricaErrors] = useState(loaderData.ericaErrors);

  useEffect(() => {
    if (fetcher.data) {
      setShowSpinner(fetcher.data.showSpinner);
      setEricaErrors(fetcher.data.ericaErrors);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (loaderData) {
      setShowSpinner(loaderData.showSpinner);
      setEricaErrors(loaderData.ericaErrors);
    }
  }, [loaderData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (showSpinner) {
        fetcher.load("/formular/zusammenfassung");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fetcher, showSpinner, ericaErrors]);

  return (
    <>
      {actionData?.previousStepsErrors && (
        <ErrorBar>{i18n.specifics.errorsInPreviousSteps}</ErrorBar>
      )}
      {ericaErrors.map((ericaError, index) => {
        return <ErrorBar key={index}>{ericaError}</ErrorBar>;
      })}
      <div className="pt-32 max-w-screen-md mx-auto w-1/2">
        <Headline>{i18n.headline}</Headline>
        <ZusammenfassungAccordion
          {...{
            allData,
            i18n,
            errors: previousStepsErrors,
            zusammenfassungFieldProps: fieldProps[0],
          }}
        />
        <div className="">
          <Form method="post" className="mb-16">
            <CsrfToken />
            {!isIdentified && (
              <div className="bg-yellow-200 mt-32 p-32 flex flex-row">
                <div className="rounded-placeholder bg-yellow-400 mr-8">
                  <Attention className="min-w-[22px]" />
                </div>

                <div className="flex flex-col">
                  <h2 className="mb-8 text-18">{i18n.specifics.fscHeading}</h2>
                  <p className="mb-24">{i18n.specifics.fscExplanation}</p>
                  <Button
                    look="tertiary"
                    to="/fsc/"
                    className="text-center w-fit"
                  >
                    {i18n.specifics.fscLinkText}
                  </Button>
                </div>
              </div>
            )}

            <h2 className="mb-24 mt-80 text-24">
              {i18n.specifics.confirmationHeading}
            </h2>
            <p className="mb-32">{i18n.specifics.confirmationText}</p>
            <div className="bg-white p-16 mb-16">
              <StepFormField {...fieldProps[1]} />
            </div>
            <div className="bg-white p-16 mb-16">
              <StepFormField {...fieldProps[2]} />
            </div>
            <div className="bg-white p-16 mb-80">
              <StepFormField {...fieldProps[3]} />
            </div>
            <Button
              id="nextButton"
              disabled={!isIdentified}
              iconRight={<Send className="h-[10px]" />}
            >
              {i18n.specifics.submitbutton}
            </Button>
          </Form>
        </div>
      </div>
      {showSpinner && <Spinner />}
    </>
  );
}

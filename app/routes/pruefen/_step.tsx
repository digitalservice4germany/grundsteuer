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
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import { createMachine } from "xstate";
import _ from "lodash";
import {
  Button,
  ButtonContainer,
  ContentContainer,
  Footer,
  SectionLabel,
} from "~/components";
import { getStepData, setStepData, StepFormData } from "~/domain/model";
import { validateStepFormData } from "~/domain/validation";
import { FallbackStepComponent } from "~/components/steps";
import stepComponents from "~/components/pruefen";
import { StepDefinition } from "~/domain/steps/index.server";
import { getCurrentStateFromUrl } from "~/util/getCurrentState";
import { StepHeadline } from "~/components/StepHeadline";
import { pageTitle } from "~/util/pageTitle";
import { getStepI18n, I18nObject } from "~/i18n/getStepI18n";
import ErrorBarStandard from "~/components/ErrorBarStandard";
import { createCsrfToken, CsrfToken, verifyCsrfToken } from "~/util/csrf";
import { getPruefenStepDefinition } from "~/domain/pruefen/steps.server";
import {
  getPruefenConfig,
  getReachablePathsFromPruefenData,
  PruefenMachineContext,
} from "~/domain/pruefen/states.server";
import { pruefenConditions } from "~/domain/pruefen/guards";
import { PruefenModel } from "~/domain/pruefen/model";
import { getBackUrl, getRedirectUrl } from "~/util/constructUrls";
import { State } from "xstate/lib/State";
import Communication from "~/components/icons/mui/Communication";
import {
  getFromPruefenStateCookie,
  saveToPruefenStateCookie,
} from "~/cookies.server";
import { commitSession, getSession } from "~/session.server";
import { HomepageHeader } from "~/components/navigation/HomepageHeader";
import { testFeaturesEnabled } from "~/util/testFeaturesEnabled";
import { useEffect, useState } from "react";
import ErrorBanner from "~/components/ErrorBanner";
import { Flags, flags } from "~/flags.server";
import { useTranslation } from "react-i18next";

const PREFIX = "pruefen";
const START_STEP = "start";
const SUCCESS_STEP = "nutzung";
const FAILURE_STEP = "keineNutzung";

export const getMachine = ({
  formData,
  testFeaturesEnabled,
}: {
  formData: PruefenModel;
  testFeaturesEnabled?: boolean;
}) => {
  const machineContext = {
    ...formData,
    testFeaturesEnabled,
  } as PruefenMachineContext;

  return createMachine(getPruefenConfig(machineContext), {
    guards: pruefenConditions,
  });
};

export type LoaderData = {
  formData: StepFormData;
  allData: PruefenModel;
  i18n: I18nObject;
  backUrl: string | null;
  isStartStep: boolean;
  isFinalStep: boolean;
  isSuccessStep: boolean;
  isFailureStep: boolean;
  currentState: string;
  weitereErklaerung: boolean;
  stepDefinition: StepDefinition;
  csrfToken: string;
  flags: Flags;
  testFeaturesEnabled?: boolean;
};

const resetFlow = async () => {
  return redirect("/" + PREFIX + "/" + START_STEP, {
    headers: {
      "Set-Cookie": await saveToPruefenStateCookie(
        getMachine({ formData: {} }).getInitialState(START_STEP)
      ),
    },
  });
};

const redirectIfStateNotReachable = (
  state: State<PruefenModel>,
  currentStateFromUrl: string
) => {
  if (!state) {
    return resetFlow();
  } else if (state.value !== currentStateFromUrl) {
    const reachablePaths = getReachablePathsFromPruefenData(state.context);
    if (!reachablePaths.includes(currentStateFromUrl)) {
      return resetFlow();
    }
  }
};

export const loader: LoaderFunction = async ({
  request,
}): Promise<LoaderData | Response> => {
  const currentStateFromUrl = getCurrentStateFromUrl(request.url);
  const cookieHeader = request.headers.get("Cookie");
  const state = (await getFromPruefenStateCookie(cookieHeader)) || undefined;

  const potentialRedirect = redirectIfStateNotReachable(
    state,
    currentStateFromUrl
  );
  if (potentialRedirect) {
    return potentialRedirect;
  }

  const storedFormData = state.context;
  const machine = getMachine({
    formData: storedFormData,
    testFeaturesEnabled: testFeaturesEnabled(),
  });
  const isFinalStep =
    machine.getStateNodeByPath(currentStateFromUrl).type === "final";
  const isSuccessStep = isFinalStep && currentStateFromUrl === SUCCESS_STEP;
  const isFailureStep = isFinalStep && currentStateFromUrl === FAILURE_STEP;
  const isStartStep = currentStateFromUrl === START_STEP;
  const backUrl = getBackUrl({
    machine,
    currentStateWithoutId: currentStateFromUrl,
    prefix: PREFIX,
  });
  const stepDefinition = getPruefenStepDefinition({
    currentState: currentStateFromUrl,
  });

  const session = await getSession(request.headers.get("Cookie"));
  const csrfToken = createCsrfToken(session);

  return json(
    {
      formData: getStepData(storedFormData, currentStateFromUrl),
      allData: storedFormData,
      i18n: await getStepI18n(currentStateFromUrl, {}, "default", PREFIX),
      backUrl,
      isStartStep,
      isFinalStep,
      isSuccessStep,
      isFailureStep,
      currentState: currentStateFromUrl,
      weitereErklaerung: !!new URL(request.url).searchParams.get(
        "weitereErklaerung"
      ),
      stepDefinition,
      csrfToken,
      flags: flags.getAllFlags(),
    },
    {
      headers: { "Set-Cookie": await commitSession(session) },
    }
  );
};

export type ActionData = {
  errors: Record<string, string>;
};

export const action: ActionFunction = async ({ request }) => {
  await verifyCsrfToken(request);

  const currentState = getCurrentStateFromUrl(request.url);
  const cookieHeader = request.headers.get("Cookie");
  const state = (await getFromPruefenStateCookie(cookieHeader)) || undefined;

  const potentialRedirect = redirectIfStateNotReachable(state, currentState);
  if (potentialRedirect) {
    return potentialRedirect;
  }

  const storedFormData = state.context;

  // validate
  const stepFormData = Object.fromEntries(
    await request.formData()
  ) as unknown as StepFormData;
  const { errors, validatedStepData } = await validateStepFormData(
    getPruefenStepDefinition({ currentState }),
    stepFormData,
    storedFormData
  );
  if (errors) return { errors } as ActionData;

  // store
  const formDataToBeStored = setStepData(
    storedFormData,
    currentState,
    validatedStepData
  ) as PruefenModel;

  const machine = getMachine({
    formData: formDataToBeStored,
    testFeaturesEnabled: testFeaturesEnabled(),
  });
  const nextState = machine.transition(currentState, {
    type: "NEXT",
  });
  const nextStepUrl = getRedirectUrl(
    nextState,
    PREFIX,
    new URL(request.url).searchParams
  );

  return redirect(nextStepUrl, {
    headers: { "Set-Cookie": await saveToPruefenStateCookie(nextState) },
  });
};

export const meta: MetaFunction = ({ data }) => {
  return { title: pageTitle(data?.i18n?.headline) };
};

export type StepComponentFunction = (
  props: LoaderData & ActionData
) => JSX.Element;

export function Step() {
  const loaderData: LoaderData = useLoaderData();
  const actionData: ActionData = useActionData() as ActionData;
  const { t } = useTranslation();
  const transition = useTransition();
  const isSubmitting = Boolean(transition.submission);
  const { i18n, backUrl, currentState, flags } = loaderData;
  const StepComponent =
    _.get(stepComponents, currentState) || FallbackStepComponent;

  const nextButtonLabel = i18n.nextButtonLabel
    ? i18n.nextButtonLabel
    : i18n.common.continue;

  const fields = loaderData.stepDefinition?.fields;
  const firstFieldDefinition = fields[Object.keys(fields)[0]];
  const headlineIsLegend =
    fields &&
    Object.keys(fields).length === 1 &&
    "type" in firstFieldDefinition &&
    firstFieldDefinition.type === "radio";

  const [isJavaScriptEnabled, setIsJavaScriptEnabled] = useState(false);

  useEffect(() => {
    setIsJavaScriptEnabled(true);
  });

  return (
    <>
      <main className="flex-grow mb-56">
        {flags.sendinblueDown && (
          <ErrorBanner
            heading={t("banners.sendinblueDownHeading")}
            service="sendinblue"
          >
            <div> {t("banners.sendinblueDownBody")} </div>
          </ErrorBanner>
        )}
        {flags.zammadDown && (
          <ErrorBanner
            style="warning"
            heading={t("banners.zammadDownHeading")}
            service="zammad"
          >
            <div> {t("banners.zammadDownBody")} </div>
          </ErrorBanner>
        )}
        <HomepageHeader skipPruefen={loaderData.weitereErklaerung} />
        <ContentContainer>
          <div className="bg-white px-16 md:px-80 py-16 md:py-56">
            <SectionLabel
              backgroundColor="gray"
              icon={<Communication />}
              className="mb-32"
            >
              Nutzung prüfen
            </SectionLabel>
            <ContentContainer size="sm-md">
              <Form
                method="post"
                className="mb-16"
                key={currentState}
                action={
                  loaderData.weitereErklaerung ? "?weitereErklaerung=true" : ""
                }
              >
                <CsrfToken value={loaderData.csrfToken} />
                {headlineIsLegend ? (
                  <>
                    {currentState == START_STEP && (
                      <h1 className="text-30 leading-36 font-bold mb-16">
                        Prüfen Sie in wenigen Schritten, ob Sie unseren
                        Online-Dienst nutzen können.
                      </h1>
                    )}
                    <fieldset>
                      <StepHeadline
                        i18n={i18n}
                        testFeaturesEnabled={loaderData.testFeaturesEnabled}
                        asLegend
                      />
                      {actionData?.errors && !isSubmitting && (
                        <ErrorBarStandard />
                      )}
                      <StepComponent {...loaderData} {...actionData} />
                    </fieldset>
                  </>
                ) : (
                  <>
                    <StepHeadline i18n={i18n} />
                    {actionData?.errors && !isSubmitting && (
                      <ErrorBarStandard />
                    )}
                    <StepComponent {...loaderData} {...actionData} />
                  </>
                )}
                <ContentContainer size="sm">
                  <ButtonContainer>
                    {!loaderData?.isFinalStep && (
                      <>
                        <Button
                          id="nextButton"
                          className={backUrl ? "" : "flex-grow-0"}
                          disabled={isSubmitting}
                        >
                          {nextButtonLabel}
                        </Button>
                        {backUrl && (
                          <Button to={backUrl} look="secondary">
                            {i18n.common.back}
                          </Button>
                        )}
                        {loaderData?.isStartStep &&
                          !loaderData.weitereErklaerung && (
                            <Button to="/" look="secondary">
                              Zur Startseite
                            </Button>
                          )}
                      </>
                    )}
                    {loaderData?.isFinalStep && (
                      <>
                        {loaderData?.isSuccessStep &&
                          !loaderData.weitereErklaerung && (
                            <Button
                              to="/registrieren"
                              id="nextButton"
                              className={backUrl ? "" : "flex-grow-0"}
                            >
                              {nextButtonLabel}
                            </Button>
                          )}
                        {loaderData?.isSuccessStep &&
                          loaderData.weitereErklaerung && (
                            <Button
                              to="/formular/welcome?weitereErklaerung=true"
                              id="nextButton"
                              className={backUrl ? "" : "flex-grow-0"}
                            >
                              {nextButtonLabel}
                            </Button>
                          )}
                        {loaderData?.isFailureStep && (
                          <Button to="/" look="ghost">
                            {i18n.common.backToHomepage}
                          </Button>
                        )}
                        {isJavaScriptEnabled && (
                          <Button
                            href="#"
                            onClick={() => history.back()}
                            look="secondary"
                          >
                            {i18n.common.back}
                          </Button>
                        )}
                      </>
                    )}
                  </ButtonContainer>
                </ContentContainer>
              </Form>
            </ContentContainer>
          </div>
        </ContentContainer>
      </main>
      <Footer />
    </>
  );
}

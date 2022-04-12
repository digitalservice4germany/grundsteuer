import {
  ActionFunction,
  Form,
  LoaderFunction,
  MetaFunction,
  redirect,
  useActionData,
  useLoaderData,
} from "remix";
import { createMachine } from "xstate";
import _ from "lodash";
import { Button } from "~/components";
import {
  getStoredFormData,
  addFormDataCookiesToHeaders,
} from "~/formDataStorage.server";
import { i18Next } from "~/i18n.server";
import { getStepData, setStepData, StepFormData } from "~/domain/model";
import { getMachineConfig, StateMachineContext } from "~/domain/states";
import { conditions } from "~/domain/guards";
import { getErrorMessage } from "~/domain/validation";
import { actions } from "~/domain/actions";
import stepComponents, {
  FallbackStepComponent,
  helpComponents,
} from "~/components/steps";
import {
  getStepDefinition,
  GrundModel,
  StepDefinition,
  StepDefinitionField,
  StepDefinitionFieldWithOptions,
} from "~/domain/steps";
import { getCurrentStateFromUrl } from "~/util/getCurrentState";
import { State } from "xstate/lib/State";
import { StateSchema, Typestate } from "xstate/lib/types";
import { StepHeadline } from "~/components/StepHeadline";
import { createGraph, getReachablePaths } from "~/domain";
import { pageTitle } from "~/util/pageTitle";
import { authenticator } from "~/auth.server";
import { getSession } from "~/session.server";
import { Params } from "react-router";

const getCurrentStateWithoutId = (currentState: string) => {
  return currentState.replace(/\.\d+\./g, ".");
};

const getMachine = ({
  formData,
  params,
}: {
  formData: GrundModel;
  params: Params;
}) => {
  const machineContext = { ...formData } as StateMachineContext;
  if (params.personId) {
    machineContext.personId = parseInt(params.personId);
  } else if (params.flurstueckId) {
    machineContext.flurstueckId = parseInt(params.flurstueckId);
  }

  return createMachine(getMachineConfig(machineContext), {
    guards: conditions,
    actions: actions,
  });
};

const getBackUrl = ({
  machine,
  currentStateWithoutId,
}: {
  machine: any;
  currentStateWithoutId: string;
}) => {
  const backState = machine.transition(currentStateWithoutId, {
    type: "BACK",
  });
  const dotNotation = backState.toStrings().at(-1);
  if (
    dotNotation === currentStateWithoutId &&
    currentStateWithoutId !== "grundstueck.flurstueck.angaben"
  ) {
    return null;
  }
  let backUrl = `/formular/${dotNotation.split(".").join("/")}`;
  if (backState.matches("eigentuemer.person")) {
    backUrl = backUrl.replace(
      "person/",
      `person/${(backState.context as StateMachineContext).personId || 1}/`
    );
  } else if (backState.matches("grundstueck.flurstueck")) {
    backUrl = backUrl.replace(
      "flurstueck/",
      `flurstueck/${
        (backState.context as StateMachineContext).flurstueckId || 1
      }/`
    );
  }
  return backUrl;
};

const getRedirectUrl = (
  state: State<
    StateMachineContext,
    Event,
    StateSchema,
    Typestate<StateMachineContext>,
    any
  >
): string => {
  let redirectUrl = `/formular/${state
    .toStrings()
    .at(-1)
    ?.split(".")
    .join("/")}`;
  if (state.matches("eigentuemer.person")) {
    redirectUrl = redirectUrl.replace(
      "person/",
      `person/${state.context.personId || 1}/`
    );
  } else if (state.matches("grundstueck.flurstueck")) {
    redirectUrl = redirectUrl.replace(
      "flurstueck/",
      `flurstueck/${state.context.flurstueckId || 1}/`
    );
  }
  return redirectUrl;
};

export type I18nObjectField = {
  label: string;
  options?: {
    [index: string]: {
      label: string;
      help?: string;
    };
  };
  placeholder?: string;
  help?: string;
};

export type I18nObject = {
  headline: string;
  headlineHelp?: string;
  fields: {
    [index: string]: I18nObjectField;
  };
  specifics: Record<string, string>;
  help: Record<string, string>;
  nextButtonLabel: string;
  common: Record<string, string>;
};

export type LoaderData = {
  formData: StepFormData;
  allData: GrundModel;
  i18n: I18nObject;
  backUrl: string | null;
  currentStateWithoutId: string;
  currentState?: string;
  stepDefinition: StepDefinition;
};

export const loader: LoaderFunction = async ({
  params,
  request,
}): Promise<LoaderData | Response> => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  const storedFormData = await getStoredFormData({ request, user });

  const currentState = getCurrentStateFromUrl(request.url);
  const currentStateWithoutId = getCurrentStateWithoutId(currentState);

  const machine = getMachine({ formData: storedFormData, params });
  const stateNodeType = machine.getStateNodeByPath(currentStateWithoutId).type;
  // redirect to first fitting child node
  if (stateNodeType == "compound") {
    const inititalState = machine.transition(currentStateWithoutId, "FAKE");
    const redirectUrl = getRedirectUrl(inititalState);
    return redirect(redirectUrl);
  }
  // redirect in case the step is not enabled
  const graph = createGraph({
    machineContext: storedFormData,
  });
  const reachablePaths = getReachablePaths({ graph, initialPaths: [] });
  if (!reachablePaths.includes(currentState)) {
    return redirect("/formular/welcome");
  }
  const backUrl = getBackUrl({ machine, currentStateWithoutId });
  const stepDefinition = getStepDefinition({ currentStateWithoutId });

  const tFunction = await i18Next.getFixedT("de", "all");
  return {
    formData: getStepData(storedFormData, currentState),
    allData: storedFormData,
    i18n: {
      ...tFunction(currentStateWithoutId, {
        id: params?.personId || params?.flurstueckId,
      }),
      common: { ...tFunction("common") },
    },
    backUrl,
    currentStateWithoutId,
    currentState,
    stepDefinition,
  };
};

export type ActionData = {
  errors: Record<string, string>;
};

export const action: ActionFunction = async ({ params, request }) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/anmelden",
  });
  const storedFormData = await getStoredFormData({ request, user });

  const currentState = getCurrentStateFromUrl(request.url);
  const currentStateWithoutId = getCurrentStateWithoutId(currentState);

  const fieldValues = Object.fromEntries(
    await request.formData()
  ) as unknown as StepFormData;

  // validate
  const errors: Record<string, string | undefined> = {};
  const stepDefinition = getStepDefinition({ currentStateWithoutId });
  const tFunction = await i18Next.getFixedT("de", "all");
  if (stepDefinition) {
    Object.entries(stepDefinition.fields).forEach(
      ([name, field]: [
        string,
        StepDefinitionField | StepDefinitionFieldWithOptions
      ]) => {
        let value = fieldValues[name];
        // unchecked checkbox
        if (typeof value == "undefined") {
          value = "";
        }

        const i18n = { ...(tFunction("errors") as object) };
        const errorMessage = getErrorMessage(
          value,
          field.validations,
          fieldValues,
          storedFormData,
          i18n
        );
        if (errorMessage) errors[name] = errorMessage;
      }
    );
  }
  if (Object.keys(errors).length > 0) return { errors } as ActionData;

  // store
  const formDataToBeStored = setStepData(
    storedFormData,
    currentState,
    fieldValues
  );

  // redirect
  const machine = getMachine({ formData: formDataToBeStored, params });
  const nextState = machine.transition(currentStateWithoutId, {
    type: "NEXT",
  });
  const redirectUrl = getRedirectUrl(nextState);

  const headers = new Headers();
  await addFormDataCookiesToHeaders({
    headers,
    data: formDataToBeStored,
    user,
  });

  return redirect(redirectUrl, {
    headers,
  });
};

export const meta: MetaFunction = ({ data }) => {
  return { title: pageTitle(data?.i18n?.headline) };
};

export type StepComponentFunction = (
  props: LoaderData & ActionData
) => JSX.Element;

export type HelpComponentFunction = (
  props: LoaderData & ActionData
) => JSX.Element;

export function Step() {
  const loaderData = useLoaderData();
  const actionData = useActionData() as ActionData;
  const { i18n, backUrl, currentStateWithoutId, currentState } = loaderData;
  const StepComponent =
    _.get(stepComponents, currentStateWithoutId) || FallbackStepComponent;
  const HelpComponent =
    _.get(helpComponents, currentStateWithoutId) || undefined;

  return (
    <div className="flex flex-col md:flex-row flex-grow h-full">
      <div className="pt-32 max-w-screen-md mx-auto w-1/2">
        <StepHeadline i18n={i18n} />
        <Form method="post" className="mb-16" key={currentState}>
          <StepComponent {...loaderData} {...actionData} />
          <div className="flex flex-row-reverse items-center justify-between">
            <Button id="nextButton">
              {i18n.nextButtonLabel
                ? i18n.nextButtonLabel
                : i18n.common.continue}
            </Button>
            {backUrl ? (
              <Button to={backUrl} look="tertiary">
                {i18n.common.back}
              </Button>
            ) : (
              ""
            )}
          </div>
        </Form>
      </div>
      {HelpComponent && (
        <div className="md:w-1/4 bg-blue-400 h-full px-16 py-32">
          <HelpComponent {...loaderData} {...actionData} />
        </div>
      )}
    </div>
  );
}

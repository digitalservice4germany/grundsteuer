import RadioGroup, { RadioGroupProps } from "./RadioGroup";
import Input, { InputProps } from "./Input";
import Select, { SelectProps } from "./Select";
import Textarea, { TextareaProps } from "./Textarea";
import SteuerIdField from "./SteuerIdField";
import Checkbox, { CheckboxProps } from "./Checkbox";
import { I18nObjectField } from "~/i18n/getStepI18n";
import { ReactNode } from "react";
import { getHelpComponent } from "~/components/form/help";
import MaskedInput from "~/components/form/MaskedInput";
import { GrundModel, StepDefinitionFields } from "~/domain/steps";
import { Bundesland } from "~/domain/steps/grundstueck/adresse";

export type StepFormFieldProps = {
  name: string;
  value?: string;
  currentState?: string;
  i18n: I18nObjectField;
  definition: StepDefinitionFields;
  error?: string;
  allData?: GrundModel;
  children?: ReactNode;
};

const getSteuernummerMaskProps = (
  bundesland: Bundesland | undefined
): {
  mask: string;
  definitions?: Record<string, RegExp>;
} => {
  switch (bundesland) {
    case "BE":
      return {
        mask: "XX/XXX/XXXXX",
        definitions: {
          X: /[0-9]/,
        },
      };
    case "HB":
      return {
        mask: "X7/XXX/XXXXX",
        definitions: {
          X: /[0-9]/,
        },
      };
    case "NW":
      return {
        mask: "XXX/XXX-3-XXXXX.X",
        definitions: {
          X: /[0-9]/,
        },
      };
    case "SH":
      return {
        mask: "XX XXX XXXXX",
        definitions: {
          X: /[0-9]/,
        },
      };

    default:
      return {
        mask: "XXX/XXX/XXXX/XXX/XXX/X",
        definitions: {
          X: /[0-9]/,
        },
      };
  }
};

const StepFormField = (props: StepFormFieldProps) => {
  const {
    name,
    value,
    currentState,
    i18n,
    definition,
    error,
    allData,
    children,
  } = props;
  const { type, options, defaultValue, htmlAttributes } = definition;

  const commonProps = {
    name,
    label: i18n.label,
    key: name,
    defaultValue: value || defaultValue,
    error,
    ...htmlAttributes,
  };

  if (type === "radio" && options) {
    const optionsWithLabelsAndHelp = options.map((option) => {
      const optionHelpComponent =
        currentState &&
        getHelpComponent({
          path: currentState + "." + name + "." + option.value,
          helpText: i18n.options?.[option.value]?.help,
        });
      return {
        ...option,
        label: i18n.options?.[option.value].label || option.value,
        help: optionHelpComponent,
        description: i18n.options?.[option.value]?.description,
      };
    });
    const radioProps: RadioGroupProps = {
      ...commonProps,
      options: optionsWithLabelsAndHelp,
    };
    return <RadioGroup {...radioProps} />;
  }

  const helpComponent =
    currentState &&
    getHelpComponent({
      path: currentState + "." + name,
      allData,
      i18n,
      helpText: i18n.help,
    });

  if (type === "select" && options) {
    const optionsWithLabels = options.map((option) => {
      return {
        ...option,
        label: i18n.options?.[option.value]?.label || option.value,
      };
    });
    const selectProps: SelectProps = {
      ...commonProps,
      options: optionsWithLabels,
      help: helpComponent,
    };
    return <Select {...selectProps} />;
  }

  if (type === "checkbox") {
    const { label, ...otherProps } = commonProps;
    const checkboxProps: CheckboxProps = {
      ...otherProps,
      help: helpComponent,
    };

    return <Checkbox {...checkboxProps}>{children || label}</Checkbox>;
  }

  if (type === "textarea") {
    const textareaProps: TextareaProps = {
      ...commonProps,
      placeholder: i18n.placeholder,
    };

    return <Textarea {...textareaProps} />;
  }

  const textProps: InputProps = {
    ...commonProps,
    placeholder: i18n.placeholder,
    help: helpComponent,
  };

  if (type === "steuerId") {
    return <SteuerIdField {...textProps} />;
  }

  if (type === "steuernummer") {
    const mask = getSteuernummerMaskProps(
      allData?.grundstueck?.adresse?.bundesland
    );
    return (
      <MaskedInput
        id="steuernummer"
        name="steuernummer"
        placeholder={i18n.placeholder}
        {...mask}
      />
    );
  }

  return <Input {...textProps} />;
};

export default StepFormField;

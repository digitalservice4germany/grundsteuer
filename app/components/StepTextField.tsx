import { Label, Input } from "@digitalservice4germany/digital-service-library";
import classNames from "classnames";
// import questionMark from "../../public/icons/questionMark.svg";
import { useState } from "react";

export type StepTextFieldProps = {
  name: string;
  label: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  help?: string;
};

export default function StepTextField(props: StepTextFieldProps) {
  const { name, label, value, defaultValue, placeholder, help } = props;
  const id = name;
  const [helpExpanded, setHelpExpanded] = useState(false);

  const labelComponent = (
    <Label htmlFor={id} className={classNames({ block: !help })}>
      {label}
    </Label>
  );
  const inputComponent = (
    <Input
      type="text"
      name={name}
      id={id}
      defaultValue={value || defaultValue}
      className={classNames({ "mb-4": !help })}
      placeholder={placeholder}
    />
  );

  if (help) {
    return (
      <details onToggle={() => setHelpExpanded(!helpExpanded)}>
        <summary
          className="list-none"
          role="button"
          aria-expanded={helpExpanded}
        >
          <div className="flex-row">
            {labelComponent}
            <p className="inline-block float-right">?</p>
            {/*<img
              src={questionMark}
              alt="Fragezeichen"
              className="inline-block float-right"
            />*/}
          </div>
          {inputComponent}
        </summary>
        <div className="bg-blue-100 p-16 mb-4">
          <p>{help}</p>
        </div>
      </details>
    );
  } else {
    return (
      <>
        {labelComponent}
        {inputComponent}
      </>
    );
  }
}

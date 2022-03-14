import { IMaskMixin } from "react-imask";
import Input from "~/components/Input";
import { StepTextFieldProps } from "~/components/StepTextField";

const InputWithMixin = IMaskMixin(({ inputRef, ...props }) => (
  <Input {...{ ...props, ref: inputRef }} />
));

type MaskedInputProps = StepTextFieldProps & {
  mask: string;
};

export default function MaskedInput(props: MaskedInputProps) {
  const { mask } = props;
  return <InputWithMixin {...props} mask={mask} />;
}

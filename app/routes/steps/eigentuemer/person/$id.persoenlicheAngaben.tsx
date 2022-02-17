import { useActionData } from "remix";
import { render } from "~/routes/steps/_step";

export { action, loader, handle } from "./../../_step";

const headline = "Persönliche Angaben";

export default function SteuerId() {
  const actionData = useActionData();

  return render(actionData, headline, <></>);
}

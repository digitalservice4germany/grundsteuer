import Bell from "~/components/icons/mui/Bell";
import { ReactNode } from "react";
import classNames from "classnames";

export default function Hint(props: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { title = "Hinweis", children, className } = props;
  return (
    <div
      className={classNames(
        "flex flex-col bg-yellow-200 rounded-lg px-36 py-24 mb-32",
        className
      )}
    >
      <div className="flex items-center">
        <Bell className="mr-12 inline-block" />
        <p className="uppercase font-bold inline-block text-11">{title}</p>
      </div>
      <div className="pl-28">{children}</div>
    </div>
  );
}

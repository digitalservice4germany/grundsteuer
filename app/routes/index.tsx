import { Link } from "remix";

export default function Index() {
  return (
    <div className="bg-beige-100 h-full p-4">
      <h1 className="mb-8 text-4xl font-bold">Welcome to Remix</h1>

      <Link
        to="/formular/grundstueck/adresse"
        className="text-2xl underline text-blue-500"
        data-testid="start-formular"
      >
        Fragebogen
      </Link>
    </div>
  );
}

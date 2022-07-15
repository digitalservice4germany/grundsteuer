import { Outlet } from "@remix-run/react";
import { UserLayout } from "~/components";

export default function Ekona() {
  return (
    <UserLayout userIsLoggedIn={true}>
      <Outlet />
    </UserLayout>
  );
}

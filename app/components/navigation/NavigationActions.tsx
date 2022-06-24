import { useEffect, useState } from "react";
import { useLocation } from "@remix-run/react";
import { LogoutButton } from "~/components";
import EmailOutlinedIcon from "~/components/icons/mui/EmailOutlined";
import NavigationLink from "./NavigationLink";
import PersonCircle from "~/components/icons/mui/PersonCircle";
import LetterIcon from "~/components/icons/mui/LetterIcon";
import classNames from "classnames";
import Lock from "~/components/icons/mui/Lock";

export default function NavigationActions(props: {
  userIsIdentified?: boolean;
  userIsLoggedIn?: boolean;
  disableLogin?: boolean;
}) {
  const location = useLocation();
  const [currentLocation, setCurrentLocation] = useState(location.pathname);

  if (!props.userIsLoggedIn) {
    return (
      <div className="px-8 mb-32">
        <NavigationLink
          to="/anmelden"
          icon={
            <PersonCircle
              className={classNames("w-24 h-24 fill-blue-800", {
                "fill-gray-800": props.disableLogin,
              })}
            />
          }
          isAllCaps
          isDisabled={props.disableLogin}
          isActive={!!currentLocation.match(/\/anmelden/)}
        >
          Anmelden
        </NavigationLink>
        <NavigationLink
          to="/hilfe"
          icon={<LetterIcon className="w-24 h-24 fill-blue-800" />}
          isAllCaps
          isActive={!!currentLocation.match(/\/hilfe/)}
        >
          Kontakt
        </NavigationLink>
      </div>
    );
  }

  useEffect(() => {
    setCurrentLocation(location.pathname);
  }, [location]);

  return (
    <div className="px-8 mb-32">
      <LogoutButton />

      {!props.userIsIdentified && (
        <NavigationLink
          to="/fsc"
          icon={<Lock className="w-24 h-24 fill-blue-800" />}
          isAllCaps
          isActive={!!currentLocation.match(/\/fsc\//)}
        >
          Freischaltcode
        </NavigationLink>
      )}
      <NavigationLink
        to="/formular/zusammenfassung"
        icon={<EmailOutlinedIcon className="w-24 h-24 fill-blue-800" />}
        isAllCaps
        isActive={!!currentLocation.match(/\/formular\/zusammenfassung/)}
      >
        Übersicht & Abgeben
      </NavigationLink>
    </div>
  );
}

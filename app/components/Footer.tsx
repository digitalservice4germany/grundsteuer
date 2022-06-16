import { useTranslation } from "react-i18next";
import { Link } from "@remix-run/react";
import bmfLogoImage from "~/assets/images/bmf-logo.svg";
import digitalserviceLogoImage from "~/assets/images/digitalservice-logo.svg";
import FloatButton from "~/components/FloatButton";
import LetterIcon from "~/components/icons/mui/LetterIcon";

export default function Footer() {
  const { t } = useTranslation("all");
  return (
    <footer className="flex-shrink-0 bg-white">
      <FloatButton
        size="small"
        className="invisible md:visible"
        look="secondary"
        floatingBorderBottom={82}
        icon={<LetterIcon />}
        to={"/hilfe"}
      >
        Können wir helfen?
      </FloatButton>
      <div className="visible md:hidden p-32 bg-blue-200 text-16 flex flex-wrap md:flex md:justify-between md:items-center ">
        <div className="flex items-center">
          {/*Put the thumbs up/down component here*/}
        </div>
        <div className="flex flex-wrap">
          <a href="/hilfe">
            Haben Sie Fragen? Sie können uns eine{" "}
            <span className="underline font-bold">Nachricht</span> schreiben.
          </a>
        </div>
      </div>
      <div className="px-16 md:px-32 lg:px-48">
        <div className="md:flex md:justify-between md:items-center gap-x-32 md:gap-x-64 pt-16">
          <div className="flex items-center shrink-0 pb-16">
            <a
              href="https://www.bundesfinanzministerium.de"
              rel="noopener"
              target="_blank"
            >
              <img
                src={bmfLogoImage}
                alt={t("footer.bmf")}
                className="w-[132px]"
                width={168}
                height={104}
              />
            </a>
            <a
              href="https://digitalservice.bund.de"
              rel="noopener"
              target="_blank"
            >
              <img
                src={digitalserviceLogoImage}
                alt={t("footer.digitalservice")}
                className="w-[70px] h-[70px]"
              />
            </a>
          </div>

          <div className="flex flex-wrap pb-16 md:justify-end gap-x-14 md:gap-x-32">
            <Link
              to="/impressum"
              className="block pb-8 text-blue-800 uppercase text-14 leading-18 font-bold tracking-widest"
            >
              {t("footer.imprint")}
            </Link>
            <Link
              to="/nutzungsbedingungen"
              className="block pb-8 text-blue-800 uppercase text-14 leading-18 font-bold tracking-widest"
            >
              {t("footer.termsOfUse")}
            </Link>
            <Link
              to="/datenschutz"
              className="block pb-8 text-blue-800 uppercase text-14 leading-18 font-bold tracking-widest"
            >
              {t("footer.dataProtection")}
            </Link>
            <Link
              to="/barrierefreiheit"
              className="block pb-8 text-blue-800 uppercase text-14 leading-18 font-bold tracking-widest"
            >
              {t("footer.accessibility")}
            </Link>
            <a
              href="https://github.com/digitalservice4germany/grundsteuer"
              target="_blank"
              className="block pb-8 text-blue-800 uppercase text-14 leading-18 font-bold tracking-widest"
            >
              {t("footer.openSource")}
            </a>
            <a
              href="https://digitalservice.bund.de/presse"
              target="_blank"
              className="block pb-8 text-blue-800 uppercase text-14 leading-18 font-bold tracking-widest"
            >
              {t("footer.press")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Instagram } from "@/components/icons";
import { mapsEmbed, mapsLink, site, telHref, whatsappHref } from "@/data/site";
import { Reveal } from "@/components/Reveal";
import { Faq } from "./Home";
import { useApp } from "@/state/app-state";

export default function Contact() {
  return (
    <>
      <ContactDetails />
      <Faq />
    </>
  );
}

function ContactDetails() {
  const { requestCallback } = useApp();
  const rows = [
    { icon: MapPin, label: "Showroom", value: `${site.address.line1}, ${site.address.line2}`, href: mapsLink },
    { icon: Clock, label: "Hours", value: site.hours },
    { icon: Phone, label: "Phone", value: site.phone, href: telHref },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    { icon: Instagram, label: "Instagram", value: site.instagramHandle, href: site.instagram },
  ];
  return (
    <div className="container-x pb-24 pt-24 lg:pt-28">
      <Reveal className="max-w-2xl">
        <p className="eyebrow">Visit us</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">Come for a coffee and a drive.</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-muted">Walk in any time we're open, or tell us which cars you'd like to see and we'll have them out front when you arrive.</p>
      </Reveal>
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid content-start gap-3">
          {rows.map(({ icon: Icon, label, value, href }) => {
            const inner = (
              <>
                <Icon className="mt-0.5 size-5 shrink-0 text-accent-fg" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-xs text-subtle">{label}</span>
                  <span className="mt-0.5 block break-words text-[15px]">{value}</span>
                </span>
              </>
            );
            return href ? (
              <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors duration-150 hover:border-line-strong">
                {inner}
              </a>
            ) : (
              <div key={label} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                {inner}
              </div>
            );
          })}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => requestCallback({ intent: "test-drive" })} className="btn-accent">
              Book a visit
            </button>
            <a href={whatsappHref("Hi VIP Motors, I'd like to visit the showroom.")} target="_blank" rel="noreferrer" className="btn-ghost">
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </a>
          </div>
        </div>
        <div className="min-h-[420px] overflow-hidden rounded-3xl border border-line">
          <iframe title="Map to VIP Motors, Rajajinagar" src={mapsEmbed} className="h-full min-h-[420px] w-full grayscale dark:invert-[0.92] dark:hue-rotate-180" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </div>
    </div>
  );
}

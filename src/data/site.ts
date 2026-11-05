// Business details in one place. Address and email come from the public
// CarWale dealer listing, Instagram from @vipmotors.india, and the phone,
// GSTIN and founding year from the showroom signboard and logo. Hours and
// the WhatsApp number are unconfirmed: check them with the showroom.
export const site = {
  name: "VIP Motors",
  tagline: "Luxury | Experience | Exclusivity",
  promise: "Curating Bengaluru's finest pre-owned luxury cars.",
  phone: "+91 97318 61111",
  whatsapp: "919731861111", // assumed to be the same number: confirm it takes WhatsApp
  established: 2010,
  gstin: "29BQAPA3773K1ZQ",
  email: "vipmotorsindia@yahoo.com",
  instagram: "https://www.instagram.com/vipmotors.india/",
  instagramHandle: "@vipmotors.india",
  instagramFollowers: "5.6K",
  address: {
    line1: "Magadi Main Road, opp. Shell petrol bunk",
    line2: "Rajajinagar, Bengaluru, Karnataka",
  },
  mapsQuery: "VIP Motors, Magadi Main Road, Rajajinagar, Bengaluru",
  hours: "Open daily, 10:00 to 20:00", // placeholder: confirm with the showroom
  services: ["Certified pre-owned cars", "Car loans", "Insurance", "Extended warranty", "Exchange"],
} as const;

export const telHref = `tel:${site.phone.replace(/\s/g, "")}`;

export function whatsappHref(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(site.mapsQuery)}&output=embed`;
export const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapsQuery)}`;

export type Fuel = "Petrol" | "Diesel" | "Electric" | "Hybrid";
export type Body = "SUV" | "Sedan" | "Coupe" | "Convertible" | "MPV";
export type Drive = "AWD" | "RWD" | "FWD" | "4x4";
export type Status = "available" | "booked" | "new-arrival";

/** Lifestyle tags the Co-Driver and the lifestyle tiles match against. */
export type Tag =
  | "family"
  | "chauffeur"
  | "performance"
  | "offroad"
  | "city"
  | "highway"
  | "eco"
  | "statement"
  | "weekend"
  | "first-luxury"
  | "reliable"
  | "comfort"
  | "tech"
  | "value"
  | "open-top";

export interface CarImage {
  src: string;
  title: string;
  credit: string;
  license: string;
  source: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  regState: string;
  km: number;
  fuel: Fuel;
  transmission: "Automatic" | "Manual";
  body: Body;
  seats: number;
  owners: number;
  exterior: string;
  interior: string;
  engine: string;
  powerHp: number;
  torqueNm: number;
  zeroTo100: number;
  topSpeed: number;
  drive: Drive;
  /** Electric range in km, where it applies. */
  rangeKm?: number;
  price: number;
  status: Status;
  tags: Tag[];
  highlights: string[];
  blurb: string;
  insurance: string;
  /** Extra words people use for this car: "g wagon", "lambo". */
  aliases?: string[];
}

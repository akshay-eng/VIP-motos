import { Collection } from "@/components/collection/Collection";
import { inventory } from "@/data/inventory";

export default function Inventory() {
  return (
    <div className="pt-16 lg:pt-[76px]">
      <Collection
        heading={
          <>
            <p className="eyebrow">Buy a car</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl lg:text-6xl">
              The <span className="display-italic text-accent">collection.</span>
            </h1>
            <p className="mt-3 text-[15px] text-muted">{inventory.length} cars at the Rajajinagar showroom, most expensive first.</p>
          </>
        }
      />
    </div>
  );
}

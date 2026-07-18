import Image from "next/image";
import { partners } from "@/lib/data";

export function Partners() {
  return (
    <section className="flex flex-col gap-10 bg-background px-4 py-14 sm:px-8 lg:gap-[60px] lg:px-[60px] lg:py-20">
      <h2 className="font-display text-2xl font-semibold text-ink">
        Our Trusted Partner
      </h2>
      <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-gray-03 sm:grid-cols-3 lg:grid-cols-5">
        {partners.map((partner) => (
          <div
            key={partner.name}
            className="flex h-[88px] items-center justify-center border-b border-r border-gray-03 bg-white [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r sm:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(3n)]:border-r lg:[&:nth-child(5n)]:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b sm:[&:nth-last-child(-n+3)]:border-b-0 lg:[&:nth-last-child(-n+3)]:border-b lg:[&:nth-last-child(-n+5)]:border-b-0 lg:h-[118px]"
          >
            <Image
              src={`/images/${partner.file}`}
              alt={partner.name}
              width={partner.width}
              height={partner.height}
              className="w-auto max-w-[70%] scale-90 lg:scale-100"
              style={{ height: partner.height }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

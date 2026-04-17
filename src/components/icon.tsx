import Image from "next/image";

type LogoTone = "colour" | "white";

type LogoAsset = {
  src: string;
  width: number;
  height: number;
};

const HORIZONTAL_ASSETS: Record<LogoTone, LogoAsset> = {
  colour: {
    src: "/logos/logo-colour-horizontal.svg",
    width: 172,
    height: 42,
  },
  white: {
    src: "/logos/logo-white-horizontal-transparent.svg",
    width: 172,
    height: 44,
  },
};

const VERTICAL_ASSETS: Record<LogoTone, LogoAsset> = {
  colour: {
    src: "/logos/logo-colour-vertical.svg",
    width: 126,
    height: 84,
  },
  white: {
    src: "/logos/logo-white-vertical-transparent.svg",
    width: 126,
    height: 84,
  },
};

const ICON_ONLY_ASSETS: Record<LogoTone, LogoAsset> = {
  colour: {
    src: "/logos/colour-icon-only.svg",
    width: 75,
    height: 57,
  },
  white: {
    src: "/logos/white-icon-only.svg",
    width: 75,
    height: 57,
  },
};

type BrandLogoProps = {
  alt?: string;
  className?: string;
  tone?: LogoTone;
};

function BrandLogo({
  alt = "Shruti Turner",
  asset,
  className,
}: Omit<BrandLogoProps, "tone"> & { asset: LogoAsset }) {
  return (
    <Image
      src={asset.src}
      alt={alt}
      width={asset.width}
      height={asset.height}
      className={className}
    />
  );
}

export function IconHorizontal({ alt, className, tone = "colour" }: BrandLogoProps) {
  return <BrandLogo alt={alt} asset={HORIZONTAL_ASSETS[tone]} className={className} />;
}

export function IconVertical({ alt, className, tone = "colour" }: BrandLogoProps) {
  return <BrandLogo alt={alt} asset={VERTICAL_ASSETS[tone]} className={className} />;
}

export function IconOnly({ alt, className, tone = "colour" }: BrandLogoProps) {
  return <BrandLogo alt={alt} asset={ICON_ONLY_ASSETS[tone]} className={className} />;
}

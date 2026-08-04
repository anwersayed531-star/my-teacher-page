const logo = { url: "/logo-moalem.png" };

interface Props {
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function BrandLogo({ className = "h-9 w-9", showWordmark = true, wordmarkClassName = "" }: Props) {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src={logo.url}
        alt="شعار منصة معلّم"
        className={`${className} rounded-lg object-contain`}
      />
      {showWordmark && (
        <span className={`font-display font-bold text-primary ${wordmarkClassName}`}>معلّم</span>
      )}
    </span>
  );
}

import { cn } from './ui/Button';

export function AgriXMark({ className, withBorder = false, ...props }) {
  return (
    <img
      src="/logo.png"
      alt="AgriX logo"
      className={cn('shrink-0 object-contain', className)}
      {...props}
    />
  );
}

export function BrandLogo({ className, markClassName = 'w-10 h-10', textClassName = 'text-2xl', tagline, ...props }) {
  return (
    <div className={cn('flex items-center gap-3', className)} {...props}>
      <AgriXMark className={markClassName} />
      <div className="leading-none">
        <span className={cn('block font-black uppercase tracking-tighter', textClassName)}>AGRIX</span>
        {tagline && (
          <span className="mt-1 block text-[0.62rem] font-black uppercase tracking-[0.24em]">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}

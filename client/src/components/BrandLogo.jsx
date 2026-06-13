import { cn } from './ui/Button';

export function AgriXMark({ className, withBorder = false, ...props }) {
  return (
    <svg
      className={cn('shrink-0', className)}
      viewBox="0 0 96 96"
      role="img"
      aria-label="AgriX logo"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M48 9L83 23V50C83 70 67 83 48 91C29 83 13 70 13 50V23L48 9Z"
        fill="#123F2A"
        stroke="#121212"
        strokeWidth={withBorder ? 7 : 6}
        strokeLinejoin="round"
      />
      <path
        d="M48 9L83 23V50C83 70 67 83 48 91V9Z"
        fill="#0C6B35"
        opacity="0.34"
      />
      <path
        d="M23 74H73"
        stroke="#F0C020"
        strokeWidth="7"
        strokeLinecap="square"
      />
      <path
        d="M48 75V42"
        stroke="#D7F7DF"
        strokeWidth="6"
        strokeLinecap="square"
      />
      <path
        d="M48 47C38 47 30 39 30 29C42 28 50 35 50 47H48Z"
        fill="#59C997"
        stroke="#121212"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M48 43C49 29 58 20 72 22C73 36 63 45 50 46L48 43Z"
        fill="#7EDFA8"
        stroke="#121212"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M20 22L34 16"
        stroke="#1040C0"
        strokeWidth="7"
        strokeLinecap="square"
      />
      <path
        d="M76 66L86 66L86 56"
        stroke="#D02020"
        strokeWidth="7"
        strokeLinecap="square"
      />
    </svg>
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

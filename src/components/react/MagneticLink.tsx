import type { ReactNode } from 'react';
import Magnet from './bits/Magnet';

interface Props {
  href: string;
  className?: string;
  external?: boolean;
  download?: boolean;
  children?: ReactNode;
  label?: string;
}

export default function MagneticLink({ href, className = 'btn', external, download, children, label }: Props) {
  return (
    <Magnet padding={60} magnetStrength={3} maxOffset={14}>
      <a
        href={href}
        className={className}
        aria-label={label}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...(download ? { download: true } : {})}
      >
        {children}
      </a>
    </Magnet>
  );
}

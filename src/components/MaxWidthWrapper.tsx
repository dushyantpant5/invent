import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface IPropType {
  className?: string;
  children: ReactNode;
}

const MaxWidthWrapper = ({ className, children }: IPropType) => {
  return (
    <div className={cn('mx-auto w-full max-w-screen-xl px-2.5 md:px-20', className)}>
      {children}
    </div>
  );
};

export default MaxWidthWrapper;

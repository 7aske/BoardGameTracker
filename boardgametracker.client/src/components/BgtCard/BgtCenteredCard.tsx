import { HTMLAttributes } from 'react';
import { cx } from 'class-variance-authority';

import { BgtHeading } from '../BgtHeading/BgtHeading';

interface Props extends HTMLAttributes<HTMLDivElement> {
  hide?: boolean;
  title?: string;
}

export const BgtCenteredCard = (props: Props) => {
  const { children, className, title = null, ...rest } = props;

  return (
    <div className="grid place-items-center md:h-full" {...rest}>
      <div
        className={cx(
          'border-card-border border rounded-lg bg-card-black p-6 md:p-10 flex flex-col items-center gap-6',
          'min-w-full xl:min-w-[650px] lg:min-w-[500px] md:min-w-[450px]',
          className
        )}
      >
        {title && <BgtHeading size="6">{title}</BgtHeading>}
        {children}
      </div>
    </div>
  );
};

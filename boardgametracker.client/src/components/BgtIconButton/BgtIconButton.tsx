import { ReactNode } from 'react';
import { cx } from 'class-variance-authority';

interface Props {
  icon: ReactNode;
  onClick: () => void;
  type?: 'normal' | 'danger';
  disabled?: boolean;
  className?: string;
}

export const BgtIconButton = (props: Props) => {
  const { icon, onClick, type = 'normal', disabled, className } = props;
  return (
    <button
      onClick={onClick}
      type="button"
      className={cx(
        '-mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8',
        className,
        type === 'normal' && 'text-gray-400 hover:text-gray-600',
        type === 'danger' && 'text-red-600 hover:text-red-800'
      )}
      disabled={disabled}
    >
      {icon}
    </button>
  );
};

import * as React from 'react';
/**
 * Action button. One primary per view; secondary is the default.
 * @startingPoint section="Forms" subtitle="Primary / secondary / ghost / danger" viewport="700x200"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;

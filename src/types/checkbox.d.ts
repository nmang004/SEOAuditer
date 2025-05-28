import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

declare module '@radix-ui/react-checkbox' {
  export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
    className?: string;
  }
}

declare const Checkbox: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & 
  React.RefAttributes<HTMLButtonElement>
>;

export { Checkbox };

import * as React from 'react';

declare module '@/components/ui/checkbox' {
  import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
  
  interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
    className?: string;
  }
  
  const Checkbox: React.ForwardRefExoticComponent<
    CheckboxProps & React.RefAttributes<HTMLButtonElement>
  >;
  
  export { Checkbox };
}

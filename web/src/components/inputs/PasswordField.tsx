import {EyeIcon, EyeOffIcon} from '@heroicons/react/solid';
import {forwardRef, useState} from 'react';

import {Props, TextField} from './TextField';

export const PasswordField = forwardRef<HTMLInputElement, Props>(
  ({input, label, message}, ref) => {
    const [show, setShow] = useState(false);

    const iconAfter = {
      onClick: () => setShow((v) => !v),
      component: show ? EyeOffIcon : EyeIcon,
    };

    return (
      <TextField
        ref={ref}
        label={label}
        message={message}
        input={{...input, type: show ? 'text' : 'password', iconAfter}}
      />
    );
  },
);

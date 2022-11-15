import {EyeIcon, EyeSlashIcon} from '@heroicons/react/24/solid';
import {forwardRef, useState} from 'react';

import {Props, TextField} from './TextField';

export const PasswordField = forwardRef<HTMLInputElement, Props>(
  ({input, label, message}, ref) => {
    const [show, setShow] = useState(false);

    const iconAfter = {
      onClick: () => setShow((v) => !v),
      component: show ? EyeSlashIcon : EyeIcon,
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

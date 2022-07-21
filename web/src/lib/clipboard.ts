import {useEffect, useRef, useState} from 'react';

import {noOp} from './effect';

export const useCopyToClipboard = () => {
  const [didCopy, setDidCopy] = useState(false);
  const ref = useRef<number | null>(null);

  const copy = (text: string, onCopy: () => void = noOp) => {
    window.clearTimeout(ref.current ?? undefined);

    ref.current = setTimeout(
      () => setDidCopy(false),
      2000,
      // Thank you TypeScript xD
    ) as unknown as number;

    try {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setDidCopy(true);
          onCopy();
        })
        .catch(noOp);
    } catch (_) {
      // ignored
    }
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(ref.current ?? undefined);
    };
  }, []);

  return {copy, didCopy};
};

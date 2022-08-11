import {useEffect, useRef, useState} from 'react';

export const useCopyToClipboard = () => {
  const [didCopy, setDidCopy] = useState(false);
  const ref = useRef<number | null>(null);

  const copy = (text: string) =>
    new Promise<void>((onSuccess, onFail) => {
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
            onSuccess;
          })
          .catch(onFail);
      } catch (e) {
        onFail(e);
      }
    });

  useEffect(() => {
    return () => {
      window.clearTimeout(ref.current ?? undefined);
    };
  }, []);

  return {copy, didCopy};
};

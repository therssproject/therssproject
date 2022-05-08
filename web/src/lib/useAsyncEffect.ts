import {DependencyList, useEffect} from 'react';

export const useAsyncEffect = (
  effect: () => Promise<void>,
  deps: DependencyList,
) => {
  useEffect(
    () => {
      effect();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );
};

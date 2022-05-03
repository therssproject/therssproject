import {DependencyList, useEffect} from 'react';

export const useAsyncEffect = (
  effect: () => Promise<void>,
  deps: DependencyList,
) => {
  useEffect(() => {
    effect();
  }, deps);
};

import * as jotai from 'jotai';

export const useAtom: <Value>(
  atom: jotai.Atom<Value>,
) => [Value, (val: Value) => void] = jotai.useAtom;

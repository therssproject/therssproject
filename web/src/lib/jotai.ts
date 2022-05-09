import * as jotai from 'jotai';

// TODO: full useAtom types implementation
export const useAtom: <Value>(
  atom: jotai.Atom<Value>,
) => [Value, (val: Value) => void] = jotai.useAtom;

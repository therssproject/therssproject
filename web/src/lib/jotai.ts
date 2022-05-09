import * as jotai from 'jotai'
import {SetAtom} from 'jotai/core/atom'

type Awaited<T> = T extends Promise<infer V> ? V : T

// At the moment the inference for the state part of the `useAtom` broken =/
// It infers to `any` / `unknown`
// With this wrapper we get the right type on the state
export const useAtom: <Value, Result extends void | Promise<void>>(
  atom: jotai.Atom<Value>,
) => [Awaited<Value>, SetAtom<Value, Result>] = jotai.useAtom

import {ClipboardIcon, TerminalIcon} from '@heroicons/react/outline';
import {useMemo} from 'react';

import {useCopyToClipboard} from '@/lib/clipboard';

type Props = {
  children: string;
};

const lineContinuation = (acc: string, line: string, isLast: boolean) =>
  isLast
    ? `${acc}${line}`
    : line.endsWith('\\')
    ? `${acc}${line}\n    `
    : `${acc}${line}\n$ `;

const formatCode = (code: string) => {
  const lines = code.split('\n');

  const last = lines.length - 1;

  return lines.reduce(
    (acc, line, i) => lineContinuation(acc, line, i === last),
    '$ ',
  );
};

export const Terminal = ({children}: Props) => {
  const {copy, didCopy} = useCopyToClipboard();

  const code = useMemo(() => formatCode(children), [children]);

  return (
    <div className="h-full rounded-lg bg-gray-200">
      <div className="w-full rounded-t-lg bg-gray-500 py-2">
        <div className="relative flex justify-between px-4 py-0.5 text-sm text-gray-100">
          <div>
            <TerminalIcon className="mr-2 inline-flex h-4 w-4 self-center" />{' '}
            Terminal
          </div>
          <div>
            <button
              type="button"
              className="w-full text-left text-gray-200 "
              onClick={() => copy(children ?? '')}
            >
              <ClipboardIcon className="mr-2 inline-flex h-4 w-4 self-center" />{' '}
              {didCopy ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
      <pre className="text-md overflow-x-auto whitespace-pre px-4 pt-4 pb-6 font-mono text-gray-900">
        {code}
      </pre>
    </div>
  );
};

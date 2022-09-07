import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as RD from 'remote-data-ts';
import useSWR_, {KeyedMutator} from 'swr';

type Result<Err, Data> = {
  data: RD.RemoteData<Err, Data>;
  mutate: KeyedMutator<Data>;
};

export const useSWR = <Err, Data>(
  key: string,
  fetcher: TE.TaskEither<Err, Data>,
): Result<Err, Data> => {
  const {data, error, isValidating, mutate} = useSWR_(key, () =>
    fetcher().then(
      E.match(
        (err) => Promise.reject(err),
        (data) => Promise.resolve(data),
      ),
    ),
  );

  if (error) {
    return {data: RD.failure(error), mutate};
  }

  if (data) {
    return {data: RD.success(data), mutate};
  }

  return isValidating
    ? {data: RD.loading, mutate}
    : {data: RD.notAsked, mutate};
};

import {FC, useEffect} from 'react';

import {laod} from '@/lib/crisp';

const Crisp: FC = () => {
  useEffect(() => {
    laod();
  }, []);

  return null;
};

export default Crisp;

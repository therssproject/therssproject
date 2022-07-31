import mixpanelPlugin from '@analytics/mixpanel';
import Analytics from 'analytics';

import {MixPanelToken} from '../config';

const analytics = Analytics({
  app: 'therssproject',
  plugins: [mixpanelPlugin({token: MixPanelToken})],
});

export const pageView = () => analytics.page();

type Json = null | number | string | Array<Json> | {[key: string]: Json};

type Payload = {[key: string]: Json};

export const event = (event: string, payload?: Payload) =>
  analytics.track(event, payload);

export const identify = (id: string, payload?: Payload) =>
  analytics.identify(id, payload);

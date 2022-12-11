import {CheckIcon} from '@heroicons/react/24/outline';

import {UnstyledButton} from '@/components/buttons/UnstyledButton';
import {UnstyledLink} from '@/components/links/UnstyledLink';

import {clsxm} from '@/lib/clsxm';
import {noOp} from '@/lib/effect';
import {Route} from '@/lib/routes';
import * as track from '@/lib/analytics/track';
import {useToast} from '@/components/Toast';

const pricing = {
  tiers: [
    {
      title: 'Freelancer',
      price: 0,
      frequency: '/month',
      description: 'The essentials to provide your best work for clients.',
      features: [
        '1 application',
        '1 endpoint per application',
        '50 feed subscriptions per application',
        'Up 5.000 monthly events',
        '7 days logs retention',
        '72-hour support response time',
      ],
      cta: 'Monthly billing',
      mostPopular: false,
    },
    {
      title: 'Startup',
      price: 5,
      frequency: '/month',
      description: 'A plan that scales with your rapidly growing business.',
      features: [
        '3 applications',
        '2 endpoints per application',
        '100 feed subscriptions per application',
        'Up to 15.000 monthly events',
        '14 days logs retention',
        '24-hour support response time',
      ],
      cta: 'Monthly billing',
      mostPopular: true,
    },
    {
      title: 'Enterprise',
      price: 50,
      frequency: '/month',
      description: 'Dedicated support and infrastructure for your company.',
      features: [
        'Unlimited applications',
        'Unlimited endpoints',
        'Unlimited subscriptions',
        'Unlimited events',
        '30 days logs retention',
        '8-hour, dedicated support response time',
      ],
      cta: 'Monthly billing',
      mostPopular: false,
    },
  ],
};

export const Pricing = () => {
  const toast = useToast();

  return (
    <div className="mx-auto max-w-7xl bg-white py-24 px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl sm:leading-none lg:text-6xl">
        Pricing plans for teams of all sizes
      </h2>
      <p className="mt-6 max-w-3xl text-xl text-gray-500">
        Choose from our range of pricing options to find the right fit for your
        projects.
      </p>

      {/* Tiers */}
      <div className="mt-24 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:space-y-0">
        {pricing.tiers.map((tier) => (
          <div
            key={tier.title}
            className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {tier.title}
              </h3>
              {tier.mostPopular ? (
                <p className="absolute top-0 -translate-y-1/2 transform rounded-full bg-teal-500 py-1.5 px-4 text-sm font-semibold text-white">
                  Most popular
                </p>
              ) : null}
              <p className="mt-4 flex items-baseline text-gray-900">
                <span className="text-5xl font-bold tracking-tight">
                  ${tier.price}
                </span>
                <span className="ml-1 text-xl font-semibold">
                  {tier.frequency}
                </span>
              </p>
              <p className="mt-6 text-gray-500">{tier.description}</p>

              {/* Feature list */}
              <ul role="list" className="mt-6 space-y-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex">
                    <CheckIcon
                      className="h-6 w-6 flex-shrink-0 text-teal-500"
                      aria-hidden="true"
                    />
                    <span className="ml-3 text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <UnstyledLink
              href={Route.register()}
              onClick={() => {
                track.toBilling(tier.title);
                toast.show(
                  'therssproject is in BETA and all plans are free at the moment',
                  {onClose: true},
                );
              }}
              className={clsxm(
                tier.mostPopular
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-200 hover:to-cyan-300 hover:text-teal-700'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100',
                'mt-8 block w-full rounded-md border border-transparent py-3 px-6 text-center font-medium',
              )}
            >
              {tier.cta}
            </UnstyledLink>
          </div>
        ))}
      </div>
    </div>
  );
};

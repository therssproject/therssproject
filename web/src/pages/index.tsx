import {Popover, Transition} from '@headlessui/react';
import {
  CloudUploadIcon,
  CodeIcon,
  MenuIcon,
  RssIcon,
  ViewListIcon,
  XIcon,
} from '@heroicons/react/outline';
import {LightningBoltIcon} from '@heroicons/react/solid';
import {ChevronRightIcon} from '@heroicons/react/solid';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {Fragment, useState} from 'react';

import * as track from '@/lib/analytics/track';
import {external} from '@/lib/href';
import {useAtom} from '@/lib/jotai';
import {Route} from '@/lib/routes';

import {Footer} from '@/components/Footer';
import {Layout} from '@/components/layout/Layout';
import {PrimaryLink} from '@/components/links/PrimaryLink';
import {UnstyledLink} from '@/components/links/UnstyledLink';
import {Logo} from '@/components/Logo';
import {Terminal} from '@/components/Terminal';

import * as SNIPPETS from '@/content/snippets';
import {SelectedAppAtom} from '@/models/application';
import {useSession} from '@/models/user';

import {NextPageWithLayout} from './_app';

type NavLink = {
  name: string;
  href: Route;
};

const navigation: NavLink[] = [
  {name: 'Product', href: Route.notFound},
  {name: 'Features', href: Route.notFound},
  {name: 'Marketplace', href: Route.notFound},
  {name: 'Company', href: Route.notFound},
];

const blogPosts = [
  {
    title: 'therssproject API Documentation',
    href: external('https://docs.therssproject.com'),
    date: 'Jul 25, 2022',
    datetime: '2022-07-25',
    category: 'Documentation',
    imageUrl: '/images/documentation.png',
    preview: 'How to use therssproject API',
    author: {
      name: 'Nicolas del Valle',
      imageUrl: 'https://avatars.githubusercontent.com/u/6719053?v=4',
      href: external('https://github.com/ndelvalle'),
    },
    readingLength: '5 min',
  },
  {
    title: 'Send messages to Discord on new feed entries',
    href: external(
      'https://github.com/therssproject/documentation/tree/main/examples/discord-webhook',
    ),
    date: 'Jul 28, 2022',
    datetime: '2022-07-28',
    category: 'Example',
    imageUrl:
      'https://github.com/therssproject/documentation/blob/main/examples/discord-webhook/assets/discord-webhook-integration.png?raw=true',
    preview:
      'Send messages to a channel on a Discord server using the Discord Webhook Integration when an RSS feed receives new entries.',
    author: {
      name: 'Christian Gill',
      imageUrl: 'https://avatars.githubusercontent.com/u/8309423?v=4',
      href: external('https://gillchristian.xyz'),
    },
    readingLength: '5 min',
  },
];

const HomePage: NextPageWithLayout = () => {
  return (
    <div className="bg-white">
      <div className="relative overflow-hidden">
        <Navigation />

        <main>
          <Hero />
          <Features />
          <UsefulResources />
          <GetStarted />
          <ByDevs />
          {
            // <HighlightedFeature />
          }
          {
            // <Testimonial />
          }
        </main>
        <Footer />
      </div>
    </div>
  );
};

HomePage.getLayout = (page) => <Layout variant="clean">{page}</Layout>;

export default HomePage;

const Navigation = () => {
  const {session} = useSession();

  return (
    <Popover as="header" className="relative">
      <div className="bg-gray-900 pt-6">
        <nav
          className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6"
          aria-label="Global"
        >
          <div className="flex flex-1 items-center">
            <div className="flex w-full items-center justify-between md:w-auto">
              <Logo style="light" />
              <div className="-mr-2 flex items-center md:hidden">
                <Popover.Button className="focus-ring-inset inline-flex items-center justify-center rounded-md bg-gray-900 p-2 text-gray-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  <MenuIcon className="h-6 w-6" aria-hidden="true" />
                </Popover.Button>
              </div>
            </div>
            {false && (
              <div className="hidden space-x-8 md:ml-10 md:flex">
                {navigation.map((item) => (
                  <UnstyledLink
                    key={item.name}
                    href={item.href}
                    className="text-base font-medium text-white hover:text-gray-300"
                  >
                    {item.name}
                  </UnstyledLink>
                ))}
              </div>
            )}
          </div>
          <div className="hidden md:flex md:items-center md:space-x-6">
            {pipe(
              session,
              O.match(
                () => (
                  <>
                    <UnstyledLink
                      key="documentation"
                      className="text-base font-medium text-white hover:text-gray-300"
                      href={external('https://docs.therssproject.com')}
                    >
                      Documentation
                    </UnstyledLink>
                    <UnstyledLink
                      key="login"
                      className="text-base font-medium text-white hover:text-gray-300"
                      href={Route.login()}
                      onClick={track.landingLogin}
                    >
                      Login
                    </UnstyledLink>
                    <UnstyledLink
                      key="register"
                      className="inline-flex items-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-base font-medium text-white hover:bg-gray-700"
                      href={Route.register()}
                      onClick={track.landingRegister}
                    >
                      Start free trial
                    </UnstyledLink>
                  </>
                ),
                () => (
                  <>
                    <UnstyledLink
                      key="documentation"
                      className="text-base font-medium text-white hover:text-gray-300"
                      href={external('https://docs.therssproject.com')}
                    >
                      Documentation
                    </UnstyledLink>
                    {
                      // NOTE: this <div /> is important to fix a bug, without
                      // it, React renders the link with href to /register (from
                      // the non-logged-in branch)
                    }
                    <div>
                      <UnstyledLink
                        key="dashboard"
                        href={Route.dashboard}
                        className="inline-flex items-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-base font-medium text-white hover:bg-gray-700"
                      >
                        Dashboard
                      </UnstyledLink>
                    </div>
                  </>
                ),
              ),
            )}
          </div>
        </nav>
      </div>

      <Transition
        as={Fragment}
        enter="duration-150 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="duration-100 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Popover.Panel
          focus
          className="absolute inset-x-0 top-0 origin-top transform p-2 transition md:hidden"
        >
          <div className="overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-black ring-opacity-5">
            <div className="flex items-center justify-between px-5 pt-4">
              <Logo style="dark" />
              <div className="-mr-2">
                <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-600">
                  <span className="sr-only">Close menu</span>
                  <XIcon className="h-6 w-6" aria-hidden="true" />
                </Popover.Button>
              </div>
            </div>
            <div className="pt-5 pb-6">
              {false && (
                <div className="space-y-1 px-2">
                  {navigation.map((item) => (
                    <UnstyledLink
                      key={item.name}
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
                    >
                      {item.name}
                    </UnstyledLink>
                  ))}
                </div>
              )}
              <div className="space-y-1 px-2">
                <UnstyledLink
                  href={external('https://docs.therssproject.com')}
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
                >
                  Documentation
                </UnstyledLink>
              </div>

              {pipe(
                session,
                O.match(
                  () => (
                    <>
                      <div key="register" className="mt-6 space-y-4 px-5">
                        <UnstyledLink
                          className="block w-full rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 py-3 px-4 text-center font-medium text-white shadow hover:from-teal-600 hover:to-cyan-700"
                          href={Route.register()}
                          onClick={track.landingRegister}
                        >
                          Start free trial
                        </UnstyledLink>
                      </div>
                      <div key="login" className="mt-6 px-5">
                        <p className="text-center text-base font-medium text-gray-500">
                          Already have an account?{' '}
                          <UnstyledLink
                            className="text-gray-900 hover:underline"
                            href={Route.login()}
                            onClick={track.landingLogin}
                          >
                            Login
                          </UnstyledLink>
                        </p>
                      </div>
                    </>
                  ),
                  () => (
                    <>
                      <div key="dashboard" className="mt-6 px-5">
                        <UnstyledLink
                          href={Route.dashboard}
                          className="block w-full rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 py-3 px-4 text-center font-medium text-white shadow hover:from-teal-600 hover:to-cyan-700"
                        >
                          Dashboard
                        </UnstyledLink>
                      </div>
                      <div key="documentation" className="mt-6 px-5">
                        <p className="text-center text-base font-medium text-gray-500">
                          <UnstyledLink
                            href={external('https://docs.therssproject.com')}
                            className="text-gray-900 hover:underline"
                          >
                            Documentation
                          </UnstyledLink>
                        </p>
                      </div>
                    </>
                  ),
                ),
              )}
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

const Hero = () => {
  const {session} = useSession();
  const [email, setEmail] = useState('');

  return (
    <div className="bg-gray-900 pt-10 sm:pt-16 lg:overflow-hidden lg:pt-8 lg:pb-14">
      <div className="mx-auto max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 sm:text-center lg:flex lg:items-center lg:px-0 lg:text-left">
            <div className="lg:py-24">
              {false && (
                <UnstyledLink
                  href={Route.notFound}
                  className="inline-flex items-center rounded-full bg-black p-1 pr-2 text-white hover:text-gray-200 sm:text-base lg:text-sm xl:text-base"
                >
                  <span className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-3 py-0.5 text-xs font-semibold uppercase leading-5 tracking-wide text-white">
                    We are hiring
                  </span>
                  <span className="ml-4 text-sm">Visit our careers page</span>
                  <ChevronRightIcon
                    className="ml-2 h-5 w-5 text-gray-500"
                    aria-hidden="true"
                  />
                </UnstyledLink>
              )}
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
                <span className="block">Turn RSS feeds</span>
                <span className="block bg-gradient-to-r from-teal-200 to-cyan-400 bg-clip-text pb-3 text-transparent sm:pb-5">
                  into webhook events
                </span>
              </h1>
              <p className="text-base text-gray-300 sm:text-xl lg:text-lg xl:text-xl">
                Programmatically subscribe and consume
                <br />
                RSS, Atom, and JSON feeds.
              </p>
              {pipe(
                session,
                O.match(
                  () => (
                    <div className="mt-10 sm:mt-12">
                      <div className="sm:mx-auto sm:max-w-xl lg:mx-0">
                        <div className="sm:flex">
                          <div className="min-w-0 flex-1">
                            <label htmlFor="email" className="sr-only">
                              Email address
                            </label>
                            <input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Enter your email"
                              className="block w-full rounded-md border-0 px-4 py-3 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                            />
                          </div>
                          <div className="mt-3 sm:mt-0 sm:ml-3">
                            <UnstyledLink
                              type="submit"
                              className="block w-full rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 py-3 px-4 font-medium text-white shadow hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                              href={Route.register(email)}
                              onClick={() => track.freeTrial(email)}
                            >
                              Start free trial
                            </UnstyledLink>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-gray-300 sm:mt-4">
                          Start your free trial, no credit card necessary.
                        </p>
                      </div>
                    </div>
                  ),
                  () => null,
                ),
              )}
            </div>
          </div>
          <div className="mt-12 -mb-16 sm:-mb-48 lg:relative lg:m-0">
            <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
              {/* Illustration taken from Lucid Illustrations: https://lucid.pixsellz.io/ */}
              <img
                className="w-full lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-auto lg:max-w-none"
                src="https://tailwindui.com/img/component-images/cloud-illustration-teal-cyan.svg"
                alt=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ByDevs = () => (
  <section className="relative bg-gray-900">
    <div className="relative h-56 bg-indigo-600 sm:h-72 md:absolute md:left-0 md:h-full md:w-1/2">
      <img
        className="h-full w-full object-cover"
        src="/images/developers.jpg"
        alt=""
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-600 mix-blend-multiply"
      />
    </div>
    <div className="relative mx-auto max-w-md px-4 py-12 sm:max-w-7xl sm:px-6 sm:py-20 md:py-28 lg:px-8 lg:py-32">
      <div className="md:ml-auto md:w-1/2 md:pl-10">
        <h2 className="text-base font-semibold uppercase tracking-wider text-gray-300">
          Made by indie hackers
        </h2>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          For developers, by developers
        </p>
        <p className="mt-3 text-lg text-gray-300">
          We made this project to solve our needs, our friends and we are using
          it as a service to build our own products. If you require more features,
          please let us know. We hope you find it useful.
        </p>
        <div className="mt-8">
          <div className="inline-flex rounded-md shadow">
            <UnstyledLink
              href={external('https://github.com/therssproject/documentation')}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-white px-5 py-3 text-base font-medium text-gray-900 hover:bg-gray-50"
            >
              Visit the documentation repo
            </UnstyledLink>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const features = [
  {
    name: 'RSS, Atom & JSON',
    soon: false,
    description:
      'We support most feed formats. Atom, JSON and all RSS variants.',
    icon: RssIcon,
  },
  {
    name: 'Almost real time',
    soon: false,
    description:
      'Get webhook events almost on real time on your feed subscriptions. Premium users get even faster updates.',
    icon: LightningBoltIcon,
  },
  {
    name: 'Tracking Webhook Events',
    soon: false,
    description:
      'We keep a record of the webhook envents sent to your endpoints. Access them at any time through the UI.',
    icon: ViewListIcon,
  },
  {
    name: 'Dashboard & API',
    soon: false,
    description:
      'Register endpoints, subscribe and parse feeds all through our simple API or from the dashboard, whichever works better for your.',
    icon: CloudUploadIcon,
  },
  {
    name: 'Transformers',
    soon: true,
    description:
      'Apply transforms to the webhook event body to match the payload that your endpoint expects.',
    icon: CodeIcon,
  },
];

const Features = () => (
  <section className="relative bg-white py-16 sm:py-24 lg:py-32">
    <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
      {false && (
        <h2 className="text-base font-semibold uppercase tracking-wider text-cyan-600">
          Deploy faster
        </h2>
      )}
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Everything you need to consume feeds
      </p>
      <p className="mx-auto mt-5 max-w-prose text-xl text-gray-500">
        Don't worry about the infrastructure for consuming RSS feeds, we take
        care of that for you.
      </p>
      <div className="mt-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.name} className="pt-6">
              <div className="flow-root h-full rounded-lg bg-gray-50 px-6 pb-8 shadow-md">
                <div className="-mt-6">
                  <div className="mb-8">
                    <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 p-3 shadow-lg">
                      <feature.icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                  <div className="relative inline-block">
                    <h3 className=" text-lg font-medium tracking-tight text-gray-900">
                      {feature.name}
                    </h3>
                    {feature.soon && (
                      <div className="absolute -top-3 -right-6 text-xs font-semibold text-cyan-600">
                        SOON
                      </div>
                    )}
                  </div>
                  <p className="mt-5 text-base text-gray-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const GetStarted = () => {
  const [currentApp, _setCurrentApp] = useAtom(SelectedAppAtom);

  return (
    <section className="relative bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-5xl lg:px-8">
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Easy to get started
        </p>
        <p className="mx-auto mt-5 max-w-prose text-xl text-gray-500">
          Three simple steps to start receiving webhook events to your
          application's endpoint on RSS feeds new entries.
        </p>

        <div className="mt-12 space-y-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-medium text-gray-800">
              1. Create an API Key
            </h3>

            <p className="text-lg text-gray-600">
              Generate an API key to authenticate the requests.
              <br />
              Go to{' '}
              {pipe(
                currentApp,
                O.match(
                  () => <>settings to generate API Keys.</>,
                  (app) => (
                    <>
                      <PrimaryLink href={Route.appSettingsKeys(app.id)}>
                        Settings {'>'} Keys
                      </PrimaryLink>{' '}
                      to generate API Keys.
                    </>
                  ),
                ),
              )}
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-medium text-gray-800">
              2. Register an endpoint
            </h3>

            <p className="text-lg text-gray-600">
              Register the your application application endpoint.
              <br />
              This is where <code>therssproject</code> will <code>POST</code>{' '}
              webhook events to.
            </p>

            <Terminal
              id="registerEndpoint"
              snippet={SNIPPETS.registerEndpoint}
              from="landing"
            />
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-medium text-gray-800">
              3. Subscribe to a feed
            </h3>

            <p className="text-lg text-gray-600">
              Subscribe to any RSS, Atom or JSON feed.
            </p>

            <Terminal
              id="createSubscription"
              snippet={SNIPPETS.createSubscription}
              from="landing"
            />
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-medium text-gray-800">
              4. Receive webhook events on new feed entries
            </h3>

            <img src="/images/receive-webhooks.png" alt="" />
          </div>
        </div>
      </div>
    </section>
  );
};

const UsefulResources = () => (
  <section className="relative bg-gray-50 py-16 sm:py-24 lg:py-32">
    <div className="relative">
      <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
        {false && (
          <h2 className="text-base font-semibold uppercase tracking-wider text-cyan-600">
            Learn
          </h2>
        )}
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Helpful Resources
        </p>
        <p className="mx-auto mt-5 max-w-prose text-xl text-gray-500">
          Guides and examples on how to quickly get started with therssproject
          UI and API.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-md gap-8 px-4 sm:max-w-lg sm:px-6 lg:max-w-7xl lg:grid-cols-3 lg:px-8">
        {blogPosts.map((post) => (
          <div
            key={post.title}
            className="flex flex-col overflow-hidden rounded-lg shadow-lg"
          >
            <div className="flex-shrink-0">
              <img
                className="h-48 w-full object-cover object-center"
                src={post.imageUrl}
                alt=""
              />
            </div>
            <div className="flex flex-1 flex-col justify-between bg-white p-6">
              <div className="flex-1">
                <p className="text-sm font-medium text-cyan-600">
                  {post.category}
                </p>
                <UnstyledLink
                  href={post.href}
                  onClick={() => track.landingResource(post.title)}
                  noTrack // track resources differently
                  className="mt-2 block"
                >
                  <p className="text-xl font-semibold text-gray-900">
                    {post.title}
                  </p>
                  <p className="mt-3 text-base text-gray-500">{post.preview}</p>
                </UnstyledLink>
              </div>
              <div className="mt-6 flex items-center">
                <div className="flex-shrink-0">
                  <UnstyledLink href={post.author.href}>
                    <img
                      className="h-10 w-10 rounded-full"
                      src={post.author.imageUrl}
                      alt={post.author.name}
                    />
                  </UnstyledLink>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    <UnstyledLink
                      href={post.author.href}
                      className="hover:underline"
                    >
                      {post.author.name}
                    </UnstyledLink>
                  </p>
                  <div className="flex space-x-1 text-sm text-gray-500">
                    <time dateTime={post.datetime}>{post.date}</time>
                    <span aria-hidden="true">&middot;</span>
                    <span>{post.readingLength} read</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const _Testimonial = () => (
  <section className="bg-gradient-to-r from-teal-500 to-cyan-600 pb-16 lg:relative lg:z-10 lg:pb-0">
    <div className="lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-8 lg:px-8">
      <div className="relative lg:-my-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1/2 bg-white lg:hidden"
        />
        <div className="mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:h-full lg:p-0">
          <div className="aspect-w-10 aspect-h-6 sm:aspect-w-16 sm:aspect-h-7 lg:aspect-none overflow-hidden rounded-xl shadow-xl lg:h-full">
            <img
              className="object-cover lg:h-full lg:w-full"
              src="https://images.unsplash.com/photo-1520333789090-1afc82db536a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2102&q=80"
              alt=""
            />
          </div>
        </div>
      </div>
      <div className="mt-12 lg:col-span-2 lg:m-0 lg:pl-8">
        <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0 lg:py-20">
          <blockquote>
            <div>
              <svg
                className="h-12 w-12 text-white opacity-25"
                fill="currentColor"
                viewBox="0 0 32 32"
                aria-hidden="true"
              >
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>
              <p className="mt-6 text-2xl font-medium text-white">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                urna nulla vitae laoreet augue. Amet feugiat est integer dolor
                auctor adipiscing nunc urna, sit.
              </p>
            </div>
            <footer className="mt-6">
              <p className="text-base font-medium text-white">Judith Black</p>
              <p className="text-base font-medium text-cyan-100">
                CEO at PureInsights
              </p>
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  </section>
);

const _HighlightedFeature = () => (
  <section className="relative bg-gray-50 pt-16 sm:pt-24 lg:pt-32">
    <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
      <div>
        <h2 className="text-base font-semibold uppercase tracking-wider text-cyan-600">
          Serverless
        </h2>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          No server? No problem.
        </p>
        <p className="mx-auto mt-5 max-w-prose text-xl text-gray-500">
          Phasellus lorem quam molestie id quisque diam aenean nulla in.
          Accumsan in quis quis nunc, ullamcorper malesuada. Eleifend
          condimentum id viverra nulla.
        </p>
      </div>
      <div className="mt-12 -mb-10 sm:-mb-24 lg:-mb-80">
        <img
          className="rounded-lg shadow-xl ring-1 ring-black ring-opacity-5"
          src="https://tailwindui.com/img/component-images/green-project-app-screenshot.jpg"
          alt=""
        />
      </div>
    </div>
  </section>
);

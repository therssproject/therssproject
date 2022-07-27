import clsx from 'clsx';
import * as React from 'react';

import {external} from '@/lib/href';
import {Route} from '@/lib/routes';

import {Button} from '@/components/buttons/Button';
import {Layout} from '@/components/layout/Layout';
import {ArrowLink} from '@/components/links/ArrowLink';
import {ButtonLink} from '@/components/links/ButtonLink';
import {PrimaryLink} from '@/components/links/PrimaryLink';
import {UnderlineLink} from '@/components/links/UnderlineLink';
import {UnstyledLink} from '@/components/links/UnstyledLink';
import {Skeleton} from '@/components/Skeleton';

import {NextPageWithLayout} from './_app';

const colorGradient = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
];

const ComponentsPage: NextPageWithLayout = () => {
  const [mode, setMode] = React.useState<'dark' | 'light'>('light');
  const toggleMode = () =>
    mode === 'dark' ? setMode('light') : setMode('dark');

  const textColor = mode === 'dark' ? 'text-gray-300' : 'text-gray-600';

  return (
    <section className={clsx([mode === 'dark' && 'bg-dark'])}>
      <div
        className={clsx(
          'layout min-h-screen py-20',
          mode === 'dark' ? 'text-white' : 'text-black',
        )}
      >
        <h1>Built-in Components</h1>
        <ArrowLink direction="left" className="mt-2" href={Route.index}>
          Back to Home
        </ArrowLink>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button
            onClick={toggleMode}
            variant={mode === 'dark' ? 'light' : 'dark'}
          >
            Set to {mode === 'dark' ? 'light' : 'dark'}
          </Button>
        </div>

        <ol className="mt-8 space-y-6">
          <li className="space-y-2">
            <h2 className="text-lg md:text-xl">Colors</h2>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {colorGradient.map((n) => (
                <div
                  key={n}
                  className={clsx(
                    `bg-cyan-${n}`,
                    'flex h-10 w-10 items-center justify-center rounded text-black',
                  )}
                >
                  {n}
                </div>
              ))}
            </div>
          </li>
          <li className="space-y-2">
            <h2 className="text-lg md:text-xl">UnstyledLink</h2>
            <p className={clsx('!mt-1 text-sm', textColor)}>
              No style applied, differentiate internal and outside links, give
              custom cursor for outside links.
            </p>
            <div className="space-x-2">
              <UnstyledLink href={Route.index}>Internal Links</UnstyledLink>
              <UnstyledLink href={external('https://theodorusclarence.com')}>
                Outside Links
              </UnstyledLink>
            </div>
          </li>
          <li className="space-y-2">
            <h2 className="text-lg md:text-xl">PrimaryLink</h2>
            <p className={clsx('!mt-1 text-sm', textColor)}>
              Add styling on top of UnstyledLink, giving a primary color to the
              link.
            </p>
            <div className="space-x-2">
              <PrimaryLink href={Route.index}>Internal Links</PrimaryLink>
              <PrimaryLink href={external('https://theodorusclarence.com')}>
                Outside Links
              </PrimaryLink>
            </div>
          </li>
          <li className="space-y-2">
            <h2 className="text-lg md:text-xl">UnderlineLink</h2>
            <p className={clsx('!mt-1 text-sm', textColor)}>
              Add styling on top of UnstyledLink, giving a dotted and animated
              underline.
            </p>
            <div className="space-x-2">
              <UnderlineLink href={Route.index}>Internal Links</UnderlineLink>
              <UnderlineLink href={external('https://theodorusclarence.com')}>
                Outside Links
              </UnderlineLink>
            </div>
          </li>
          <li className="space-y-2">
            <h2 className="text-lg md:text-xl">ArrowLink</h2>
            <p className={clsx('!mt-1 text-sm', textColor)}>
              Useful for indicating navigation, I use this quite a lot, so why
              not build a component with some whimsy touch?
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <ArrowLink href={Route.index} direction="left">
                Direction Left
              </ArrowLink>
              <ArrowLink href={Route.index}>Direction Right</ArrowLink>
              <ArrowLink
                as={UnstyledLink}
                className="inline-flex items-center"
                href={Route.index}
              >
                Polymorphic
              </ArrowLink>
              <ArrowLink
                as={ButtonLink}
                variant="light"
                className="inline-flex items-center"
                href={Route.index}
              >
                Polymorphic
              </ArrowLink>
            </div>
          </li>
          <li className="space-y-2">
            <h2 className="text-lg md:text-xl">ButtonLink</h2>
            <p className={clsx('!mt-1 text-sm', textColor)}>
              Button styled link with 3 variants.
            </p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink
                variant="primary"
                href={external('https://theodorusclarence.com')}
              >
                Primary Variant
              </ButtonLink>
              <ButtonLink
                variant="outline"
                isDarkBg={mode === 'dark'}
                href={external('https://theodorusclarence.com')}
              >
                Outline Variant
              </ButtonLink>
              <ButtonLink
                variant="ghost"
                isDarkBg={mode === 'dark'}
                href={external('https://theodorusclarence.com')}
              >
                Ghost Variant
              </ButtonLink>
              <ButtonLink
                variant="dark"
                href={external('https://theodorusclarence.com')}
              >
                Dark Variant
              </ButtonLink>
              <ButtonLink
                variant="light"
                href={external('https://theodorusclarence.com')}
              >
                Light Variant
              </ButtonLink>
            </div>
          </li>
          <li className="space-y-2">
            <h2 className="text-lg md:text-xl">Button</h2>
            <p className={clsx('!mt-1 text-sm', textColor)}>
              Ordinary button with style.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Primary Variant</Button>
              <Button variant="outline" isDarkBg={mode === 'dark'}>
                Outline Variant
              </Button>
              <Button variant="ghost" isDarkBg={mode === 'dark'}>
                Ghost Variant
              </Button>
              <Button variant="dark">Dark Variant</Button>
              <Button variant="light">Light Variant</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled variant="primary">
                Disabled
              </Button>
              <Button disabled variant="outline" isDarkBg={mode === 'dark'}>
                Disabled
              </Button>
              <Button disabled variant="ghost" isDarkBg={mode === 'dark'}>
                Disabled
              </Button>
              <Button disabled variant="dark">
                Disabled
              </Button>
              <Button disabled variant="light">
                Disabled
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button isLoading variant="primary">
                Disabled
              </Button>
              <Button isLoading variant="outline" isDarkBg={mode === 'dark'}>
                Disabled
              </Button>
              <Button isLoading variant="ghost" isDarkBg={mode === 'dark'}>
                Disabled
              </Button>
              <Button isLoading variant="dark">
                Disabled
              </Button>
              <Button isLoading variant="light">
                Disabled
              </Button>
            </div>
          </li>
          <li className="space-y-2">
            <h2 className="text-lg md:text-xl">Custom 404 Page</h2>
            <p className={clsx('!mt-1 text-sm', textColor)}>
              Styled 404 page with some animation.
            </p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={Route.notFound}>Visit the 404 page</ButtonLink>
            </div>
          </li>
          {/* TODO find the way to enable and use this!
          <li className="space-y-2">
            <h2 className="text-lg md:text-xl">Next Image</h2>
            <p className={clsx('!mt-1 text-sm', textColor)}>
              Next Image with default props and skeleton animation
            </p>
            <NextImage
              className="mt-8"
              src="/favicon/apple-icon-180x180.png"
              width="180"
              height="180"
              alt="Icon"
            />
          </li>
          */}
          <li className="space-y-2">
            <h2 className="text-lg md:text-xl">Skeleton</h2>
            <p className={clsx('!mt-1 text-sm', textColor)}>
              Skeleton with shimmer effect
            </p>
            <Skeleton className="h-72 w-72" />
          </li>
        </ol>
      </div>
    </section>
  );
};

ComponentsPage.getLayout = (page) => (
  <Layout variant="clean" seo={{templateTitle: 'Component library'}}>
    {page}
  </Layout>
);

export default ComponentsPage;

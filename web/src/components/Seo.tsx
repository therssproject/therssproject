import Head from 'next/head';
import {useRouter} from 'next/router';

import {openGraph} from '@/lib/helper';

const defaultMeta = {
  title: 'therssproject',
  siteName: 'therssproject',
  description:
    'Consume and subscribe to RSS, Atom, and JSON feeds programmatically',
  keywords:
    'rss api, webhook, atom, rss, json, feeds, subscribe, events, pubsub, api, programmatically',
  // IMPORTANT no additional '/' at the end
  url: 'https://therssproject.com',
  type: 'website',
  robots: 'follow, index',
  // No need to fill, will be populated by openGraph function
  image: '',
};

export type Props = {
  date?: string;
  templateTitle?: string;
} & Partial<typeof defaultMeta>;

export const Seo = (props: Props) => {
  const router = useRouter();
  const meta = {...defaultMeta, ...props};

  meta['title'] = props.templateTitle
    ? `${props.templateTitle} | ${meta.siteName}`
    : meta.title;

  // Use siteName if there is templateTitle
  // but show full title if there is none
  meta['image'] = openGraph({
    description: meta.description,
    siteName: props.templateTitle ? meta.siteName : meta.title,
    templateTitle: props.templateTitle,
  });

  return (
    <Head>
      <title>{meta.title}</title>
      <meta name="robots" content={meta.robots} />
      <meta content={meta.description} name="description" />
      <meta property="og:url" content={`${meta.url}${router.asPath}`} />
      <link rel="canonical" href={`${meta.url}${router.asPath}`} />
      <meta name="keywords" content={meta.keywords} />
      {/* Open Graph */}
      <meta property="og:type" content={meta.type} />
      <meta property="og:site_name" content={meta.siteName} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta name="image" property="og:image" content={meta.image} />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@th_clarence" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={meta.image} />
      {meta.date && (
        <>
          <meta property="article:published_time" content={meta.date} />
          <meta
            name="publish_date"
            property="og:publish_date"
            content={meta.date}
          />
          <meta
            name="author"
            property="article:author"
            content="Theodorus Clarence"
          />
        </>
      )}

      {/* Favicons */}
      <link rel="manifest" href="/favicon/site.webmanifest" />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/favicon/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon/favicon-16x16.png"
      />
      <link
        rel="mask-icon"
        href="/favicon/safari-pinned-tab.svg"
        color="#5bbad5"
      />
      <meta name="msapplication-TileColor" content="#da532c" />
      <meta
        name="msapplication-TileImage"
        content="/favicon/apple-touch-icon.png"
      />
      <meta name="theme-color" content="#ffffff" />
    </Head>
  );
};

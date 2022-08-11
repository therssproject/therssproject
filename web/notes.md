## TODO

### MVP IH

- [ ] Logs => pagination
- [x] Profile WIP instead of 404
- [x] Billing on application settings
- [x] Logo & footer layout => Documentation, Not Found
- [x] Favicon & stuff
- [x] Crisp chat (https://crisp.chat/en/livechat/)
- [x] Login/Register => submit errors
- [x] Buttons styles from Tailwind
- [x] SEO of pages
- [x] Logs => empty case
- [x] Keys => empty case
- [x] Subs => No endpoints case (reuse the same styles)
- [x] Login/Register => Link to landing
- [x] Landing page => link to docs
- [x] Logs => no relative date
- [x] Logs => item show data even when sub/endpoint were deleted
- [x] Sidebar icons
- [x] Add trends to stats => (with limit 0 of previous week to show trends)
- [x] Remove "created" toasts
- [x] Feed parsing in the docs
- [x] "ID: ..." on copyable IDs
- [x] Populate dashboard using the pagination headers
- [x] Documentation clean layout

### Landing

- [x] Issues repo & "For developers by developers" section at the end
- [x] "Free trial" links to register with prefilled email
- [x] Developers image

### Ideas

- [ ] `/documentation` should be replaced with `docs.therssproject.com`
- [ ] GitHub feeds => `https://github.com/mapstruct/mapstruct/releases.atom`
- [ ] Project on Vercel with "Deploy to Vercel" button
- [ ] BTC or Weather feeds `https://cointelegraph.com/rss`
- [ ] Marketing on Reddit => `https://www.albertjo.xyz/blog/how-to-promote-advertise-your-software-project-on-reddit`
- [ ] React docs inspiration for code snippet components => `https://beta.reactjs.org/apis`
- [x] Discord Webhooks => `https://discord.com/developers/docs/resources/webhook#execute-webhook`
- [x] Host documentation on Jekyll (fp-ts theme)

### Application entities

- [x] List
  - [x] Endpoints
  - [x] Subscriptions
  - [x] Logs (ie. webhook events)
  - [ ] Pagination => or "last X" in the title
- [x] Create
  - [x] Endpoints
  - [x] Subscriptions
- [x] Update
  - [x] Endpoints
- [ ] Item styles
  - [ ] Endpoints
  - [ ] Subscriptions
  - [ ] Logs (ie. webhook events)
- [ ] Item view
  - [ ] Endpoints
  - [ ] Subscriptions
  - [ ] Logs (ie. webhook events)

### Refactor

- [ ] `useSessionCheck` (from `models/user`)
- [ ] Toast and other components
- [ ] Move to a library ? => For Tsearch as well

------

### Later

- [ ] Pricing section
- [ ] Analytics => Setup proxy (`https://developer.mixpanel.com/docs/collection-via-a-proxy` / `https://dev.to/rain2o/using-mixpanel-via-proxy-with-nextjs-rewrites-130e`)
- [ ] Stats => week and month range picker
- [ ] Add `metadata` field to Subscription form
- [ ] Cleanup duplication between `layout/Applications` and `layout/Dashboard`
- [ ] Checkout `useSWR` or implement a `RemoteData` hook => keep (re)loading logs
- [ ] Generalize Select? (Subscription form one)
- [ ] Select with actions per option? (sidebar one)
- [ ] Input / Field styles
- [ ] Show button to create new and "Comming soon" modal? Or disable the select?
- [ ] Avatar on user profiles
- [ ] Deploy my own OG images service
- [x] RSS providers might rate limit our backend => Mentioned to Nico already xD
- [x] Reset application

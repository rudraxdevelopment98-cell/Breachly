/**
 * Curated data-broker / people-search targets (aegis §9).
 *
 * Start with ~15-20 high-traffic people-search sites outside the scope of any
 * single deletion registry. Each entry names the registry that can action a
 * deletion, if any — California's DROP platform covers CA-registered brokers,
 * so those route through the DROP adapter instead of a per-site scraper.
 */

export interface BrokerTarget {
  name: string;
  domain: string;
  /** Deletion registry key that covers this broker, if any (e.g. "ca_drop"). */
  registry: string | null;
  /** Direct opt-out page, used when no registry covers the broker. */
  optOutUrl: string;
}

export const CURATED_BROKERS: BrokerTarget[] = [
  { name: 'Spokeo', domain: 'spokeo.com', registry: 'ca_drop', optOutUrl: 'https://www.spokeo.com/optout' },
  { name: 'WhitePages', domain: 'whitepages.com', registry: 'ca_drop', optOutUrl: 'https://www.whitepages.com/suppression-requests' },
  { name: 'BeenVerified', domain: 'beenverified.com', registry: 'ca_drop', optOutUrl: 'https://www.beenverified.com/app/optout/search' },
  { name: 'Intelius', domain: 'intelius.com', registry: 'ca_drop', optOutUrl: 'https://www.intelius.com/opt-out' },
  { name: 'PeopleFinders', domain: 'peoplefinders.com', registry: 'ca_drop', optOutUrl: 'https://www.peoplefinders.com/opt-out' },
  { name: 'TruePeopleSearch', domain: 'truepeoplesearch.com', registry: null, optOutUrl: 'https://www.truepeoplesearch.com/removal' },
  { name: 'MyLife', domain: 'mylife.com', registry: 'ca_drop', optOutUrl: 'https://www.mylife.com/ccpa/index.pubview' },
  { name: 'Radaris', domain: 'radaris.com', registry: null, optOutUrl: 'https://radaris.com/control/privacy' },
  { name: 'PeopleConnect', domain: 'peopleconnect.us', registry: 'ca_drop', optOutUrl: 'https://www.peopleconnect.us/optout' },
  { name: 'US Search', domain: 'ussearch.com', registry: 'ca_drop', optOutUrl: 'https://www.ussearch.com/opt-out' },
  { name: 'InstantCheckmate', domain: 'instantcheckmate.com', registry: 'ca_drop', optOutUrl: 'https://www.instantcheckmate.com/opt-out' },
  { name: 'TruthFinder', domain: 'truthfinder.com', registry: 'ca_drop', optOutUrl: 'https://www.truthfinder.com/opt-out' },
  { name: 'PeekYou', domain: 'peekyou.com', registry: null, optOutUrl: 'https://www.peekyou.com/about/contact/optout' },
  { name: 'FastPeopleSearch', domain: 'fastpeoplesearch.com', registry: null, optOutUrl: 'https://www.fastpeoplesearch.com/removal' },
  { name: 'Nuwber', domain: 'nuwber.com', registry: null, optOutUrl: 'https://nuwber.com/removal/link' },
  { name: 'CheckPeople', domain: 'checkpeople.com', registry: null, optOutUrl: 'https://www.checkpeople.com/opt-out' },
  { name: 'Advanced Background Checks', domain: 'advancedbackgroundchecks.com', registry: null, optOutUrl: 'https://www.advancedbackgroundchecks.com/removal' },
  { name: 'Clustrmaps', domain: 'clustrmaps.com', registry: null, optOutUrl: 'https://clustrmaps.com/bl/opt-out' },
  { name: 'SearchPeopleFree', domain: 'searchpeoplefree.com', registry: null, optOutUrl: 'https://www.searchpeoplefree.com/opt-out' },
  { name: 'Ownerly', domain: 'ownerly.com', registry: 'ca_drop', optOutUrl: 'https://www.ownerly.com/opt-out' },
];

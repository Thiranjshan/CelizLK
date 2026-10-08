export interface HeroSequenceGroup {
  id: string;
  text: string;
  variant: 'outline' | 'solid' | 'serif-italic' | 'intro' | 'thin-spaced';
  animation: 'fade-up' | 'scale-down' | 'slide-right' | 'slide-left' | 'scale-up' | 'mask-reveal' | 'fade' | 'slide-up';
  delay: number; // in seconds
  highlight?: boolean;
}

export interface HeroSequence {
  id: string;
  sequenceNumber: string;
  intro?: {
    text: string;
    variant: 'intro';
    animation: 'fade-up';
    delay: number;
  };
  layout: 'stacked' | 'horizontal-settle' | 'three-line' | 'editorial-column';
  groups: HeroSequenceGroup[];
}

export const HERO_SEQUENCES: HeroSequence[] = [
  // SEQUENCE 01 — WELCOME
  {
    id: 'seq-01-welcome',
    sequenceNumber: '01',
    intro: {
      text: 'WELCOME TO',
      variant: 'intro',
      animation: 'fade-up',
      delay: 0.25,
    },
    layout: 'horizontal-settle',
    groups: [
      {
        id: 'celiz',
        text: 'CELIZ',
        variant: 'solid',
        animation: 'scale-down',
        delay: 0.5,
      },
      {
        id: 'lk',
        text: 'LK',
        variant: 'outline',
        animation: 'slide-left',
        delay: 0.75,
      },
    ],
  },

  // SEQUENCE 02 — FIND YOUR TECH
  {
    id: 'seq-02-find-tech',
    sequenceNumber: '02',
    layout: 'three-line',
    groups: [
      {
        id: 'find-the-tech',
        text: 'Find the tech',
        variant: 'solid',
        animation: 'slide-right',
        delay: 0.25,
      },
      {
        id: 'that-fits',
        text: 'that fits',
        variant: 'serif-italic',
        animation: 'slide-left',
        delay: 0.6,
      },
      {
        id: 'you',
        text: 'you.',
        variant: 'solid',
        animation: 'scale-up',
        delay: 0.95,
        highlight: true,
      },
    ],
  },

  // SEQUENCE 03 — TECH MADE SIMPLE
  {
    id: 'seq-03-tech-simple',
    sequenceNumber: '03',
    layout: 'stacked',
    groups: [
      {
        id: 'tech',
        text: 'TECH',
        variant: 'outline',
        animation: 'fade',
        delay: 0.25,
      },
      {
        id: 'made',
        text: 'MADE',
        variant: 'solid',
        animation: 'slide-up',
        delay: 0.6,
      },
      {
        id: 'simple',
        text: 'SIMPLE.',
        variant: 'solid',
        animation: 'scale-up',
        delay: 0.95,
        highlight: true,
      },
    ],
  },

  // SEQUENCE 04 — MORE THAN GADGETS
  {
    id: 'seq-04-more-than-gadgets',
    sequenceNumber: '04',
    layout: 'stacked',
    groups: [
      {
        id: 'more-than',
        text: 'MORE THAN',
        variant: 'thin-spaced',
        animation: 'fade',
        delay: 0.2,
      },
      {
        id: 'just',
        text: 'JUST',
        variant: 'serif-italic',
        animation: 'scale-up',
        delay: 0.6,
      },
      {
        id: 'gadgets',
        text: 'GADGETS.',
        variant: 'outline',
        animation: 'mask-reveal',
        delay: 0.95,
      },
    ],
  },

  // SEQUENCE 05 — DISCOVER WHAT'S NEXT
  {
    id: 'seq-05-discover-next',
    sequenceNumber: '05',
    layout: 'stacked',
    groups: [
      {
        id: 'discover',
        text: 'DISCOVER',
        variant: 'thin-spaced',
        animation: 'fade',
        delay: 0.25,
      },
      {
        id: 'whats',
        text: "WHAT'S",
        variant: 'serif-italic',
        animation: 'slide-up',
        delay: 0.6,
      },
      {
        id: 'next',
        text: 'NEXT.',
        variant: 'solid',
        animation: 'scale-up',
        delay: 0.95,
        highlight: true,
      },
    ],
  },

  // SEQUENCE 06 — TRUSTED TECH PARTNER
  {
    id: 'seq-06-trusted-partner',
    sequenceNumber: '06',
    intro: {
      text: 'YOUR TRUSTED',
      variant: 'intro',
      animation: 'fade-up',
      delay: 0.2,
    },
    layout: 'stacked',
    groups: [
      {
        id: 'tech-partner-tech',
        text: 'TECH',
        variant: 'solid',
        animation: 'slide-up',
        delay: 0.55,
      },
      {
        id: 'tech-partner-partner',
        text: 'PARTNER',
        variant: 'outline',
        animation: 'slide-left',
        delay: 0.85,
      },
    ],
  },
];

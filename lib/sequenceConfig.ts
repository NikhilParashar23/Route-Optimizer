/**
 * RouteWise Sequence Configuration
 * Source of truth derived from Reference.md with user-supplied frames
 */

export const FRAME_COUNT = 1264;
export const SEQUENCE_FOLDER = '/sequence-main';
export const FRAME_PREFIX = 'frame_';
export const FRAME_EXTENSION = '.webp';
export const REDUCED_MOTION_FRAME_INDEX = 632;

export interface ChapterConfig {
  id: number;
  title: string;
  subtitle?: string;
  timeRange: string;
  frameRange: [number, number];
  progressRange: [number, number];
  headline: string;
  subheadline?: string;
  stats?: {
    value: number | string;
    label: string;
    suffix?: string;
    prefix?: string;
    isNumeric?: boolean;
  }[];
}

export const CHAPTERS: ChapterConfig[] = [
  {
    id: 1,
    title: 'Hero',
    timeRange: '0.0s – 2.0s',
    frameRange: [1, Math.round(FRAME_COUNT * 0.20)],
    progressRange: [0.00, 0.20],
    headline: 'School transportation, optimized.',
    subheadline: 'Next-generation telemetry, automated dispatching, and dynamic route computation for modern educational districts.',
  },
  {
    id: 2,
    title: 'Count-up',
    timeRange: '2.0s – 4.0s',
    frameRange: [Math.round(FRAME_COUNT * 0.20) + 1, Math.round(FRAME_COUNT * 0.40)],
    progressRange: [0.20, 0.40],
    headline: 'Real-time student ridership sync',
    subheadline: 'Dynamic manifest consolidation tracks real-time student boarding and attendance instantly.',
    stats: [
      {
        value: 86,
        label: 'students tracked',
        suffix: ' students',
        isNumeric: true,
      },
    ],
  },
  {
    id: 3,
    title: 'Pickup points',
    timeRange: '4.0s – 6.0s',
    frameRange: [Math.round(FRAME_COUNT * 0.40) + 1, Math.round(FRAME_COUNT * 0.60)],
    progressRange: [0.40, 0.60],
    headline: 'Intelligent cluster resolution',
    subheadline: 'Algorithmic stop generation minimizes walking distance and eliminates hazard zone crossings.',
    stats: [
      {
        value: 14,
        label: 'pickup points',
        suffix: ' pickup points',
        isNumeric: true,
      },
      {
        value: 4,
        label: 'buses',
        suffix: ' buses',
        isNumeric: true,
      },
    ],
  },
  {
    id: 4,
    title: 'Route draw',
    timeRange: '6.0s – 8.0s',
    frameRange: [Math.round(FRAME_COUNT * 0.60) + 1, Math.round(FRAME_COUNT * 0.80)],
    progressRange: [0.60, 0.80],
    headline: 'Dynamic turn-by-turn routing',
    subheadline: 'Synchronized vehicle dispatch with real-time avoidance of construction and traffic bottlenecks.',
    stats: [
      {
        value: 4,
        label: 'buses deployed',
        suffix: ' buses',
        isNumeric: true,
      },
      {
        value: 48.2,
        label: 'total distance',
        suffix: ' km',
        isNumeric: true,
      },
      {
        value: 'optimized route',
        label: 'status',
        isNumeric: false,
      },
    ],
  },
  {
    id: 5,
    title: 'Dashboard reveal',
    timeRange: '8.0s – 10.0s',
    frameRange: [Math.round(FRAME_COUNT * 0.80) + 1, FRAME_COUNT],
    progressRange: [0.80, 1.00],
    headline: 'One intelligent fleet',
    subheadline: 'Complete situational awareness across every vehicle, driver, student, and district route.',
  },
];

export const COLOR_TOKENS = {
  bgGrid: '#0A0C10',
  bgPanel: '#12151C',
  routeBlue: '#3B82F6',
  signalCyan: '#00E5C7',
  busYellow: '#FFC93C',
  textPrimary: '#F5F6F8',
  textMuted: '#8A93A3',
} as const;

/**
 * Returns formatted 4-digit zero-padded frame filename (e.g. frame_0001.webp)
 */
export function getFrameFileName(index: number): string {
  const clamped = Math.max(1, Math.min(FRAME_COUNT, Math.round(index)));
  const padded = String(clamped).padStart(4, '0');
  return `${FRAME_PREFIX}${padded}${FRAME_EXTENSION}`;
}

/**
 * Returns full path for a given frame index
 */
export function getFramePath(index: number): string {
  return `${SEQUENCE_FOLDER}/${getFrameFileName(index)}`;
}

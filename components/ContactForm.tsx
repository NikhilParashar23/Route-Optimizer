'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useForm,
  useFieldArray,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  fetchSampleData,
  runOptimizer,
} from '@/lib/results/api';

import {
  resolveLocation,
  type LatLng,
} from '@/lib/results/geocode';

import {
  countCustomStudents,
  resolveCustomStudents,
} from '@/lib/results/customStudents';

import { uploadStudentRoster } from '@/lib/results/roasterUpload';

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bus,
  ChevronDown,
  FileSpreadsheet,
  Footprints,
  Fuel,
  MapPin,
  PlayCircle,
  Plus,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  Sliders,
  Sparkles,
  Timer,
  Trash2,
  Users,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

// Used to complete short Plus Codes when nothing better is known.
const DEFAULT_REFERENCE: LatLng = { lat: 20.959013, lng: 77.755547 };

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

const wizardSchema = z.object({
  locationInput: z
    .string()
    .min(3, 'Enter a valid school location'),

  schoolName: z.string().max(80).optional(),

  fleetTypes: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Enter a bus type name'),
      count: z.coerce.number().min(0).max(50),
      capacity: z.coerce.number().min(1).max(100),
    })
  ).min(1, 'Add at least one bus type'),

  dataSourceType: z.enum(['preset', 'csv']),

  presetStudentCount: z.coerce
    .number()
    .min(10)
    .max(300),

  specificStudents: z.array(
    z.object({
      name: z.string(),
      plusCode: z.string(),
      landmark: z.string(),
    })
  ).optional(),

  uploadedFile: z.any().optional(),

  maxWalkDistance: z.coerce
    .number()
    .min(100)
    .max(1000),

  maxRouteDuration: z.coerce
    .number()
    .min(20)
    .max(120),

  timeWeight: z.coerce
    .number()
    .min(0)
    .max(8),

  fuelEfficiency: z.coerce
    .number()
    .min(3)
    .max(15),

  fuelPrice: z.coerce
    .number()
    .min(50)
    .max(150),
});

type WizardFormData = z.infer<typeof wizardSchema>;

type SampleResponse = {
  school: Record<string, any>;
  students: Array<Record<string, any>>;
};

type SchoolLocation = {
  name: string;
  lat: number;
  lng: number;
};

const locationKey = (school: { lat: number; lng: number }) =>
  `${school.lat.toFixed(6)},${school.lng.toFixed(6)}`;

/* -------------------------------------------------------------------------- */
/* Reusable UI                                                                */
/* -------------------------------------------------------------------------- */

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
      {children}
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
          {icon}
          {label}
        </span>

        <span className="shrink-0 text-xs font-mono text-signal-cyan">
          {value}
        </span>
      </div>

      {children}
    </div>
  );
}

function ErrorMessage({
  children,
}: {
  children?: React.ReactNode;
}) {
  if (!children) return null;

  return (
    <p className="flex items-center gap-1 text-[11px] text-red-400">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Form                                                                  */
/* -------------------------------------------------------------------------- */

export function ContactForm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [isBusListOpen, setIsBusListOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sampleData, setSampleData] =
    useState<SampleResponse | null>(null);
  const [loadedSampleCount, setLoadedSampleCount] =
    useState<number | null>(null);
  const [loadedLocationKey, setLoadedLocationKey] = useState('');
  const [loadedLocationText, setLoadedLocationText] = useState('');
  const [resolvedLabel, setResolvedLabel] = useState('');
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: 'onTouched',

    defaultValues: {
      locationInput: 'XQ54+J63 Amravati, Maharashtra',
      schoolName: 'Government college of engineering',

      fleetTypes: [
        {
          id: 'mini',
          name: 'Mini bus',
          count: 2,
          capacity: 15,
        },
        {
          id: 'medium',
          name: 'Medium bus',
          count: 2,
          capacity: 25,
        },
        {
          id: 'large',
          name: 'Large bus',
          count: 1,
          capacity: 40,
        },
      ],

      dataSourceType: 'preset',
      presetStudentCount: 60,

      specificStudents: [],
      maxWalkDistance: 300,
      maxRouteDuration: 60,
      timeWeight: 5,
      fuelEfficiency: 8,
      fuelPrice: 100,
    },
  });

  const {
    fields: fleetFields,
    append: appendFleetType,
    remove: removeFleetType,
  } = useFieldArray({
    control,
    name: 'fleetTypes',
  });

  const {
    fields: studentFields,
    append: appendStudent,
    remove: removeStudent,
  } = useFieldArray({
    control,
    name: 'specificStudents',
  });

  const fleetTypes = watch('fleetTypes') || [];
  const studentCount = Number(watch('presetStudentCount')) || 60;
  const maxWalkDistance = Number(watch('maxWalkDistance'));
  const maxRouteDuration = Number(watch('maxRouteDuration'));
  const timeWeight = Number(watch('timeWeight'));
  const fuelEfficiency = Number(watch('fuelEfficiency'));
  const fuelPrice = Number(watch('fuelPrice'));
  const dataSourceType = watch('dataSourceType');
  const currentLocationText = (watch('locationInput') || '').trim();

  // Custom student rows only apply to the preset generator.
  const isCsvMode = dataSourceType === 'csv';
  const customCount = isCsvMode
    ? 0
    : countCustomStudents(watch('specificStudents'));
  const requestedStudents = studentCount + customCount;

  const totalBuses = fleetTypes.reduce(
    (sum, type) => sum + Math.max(0, Number(type.count) || 0),
    0
  );

  const totalSeats = fleetTypes.reduce(
    (sum, type) =>
      sum +
      Math.max(0, Number(type.count) || 0) *
        Math.max(0, Number(type.capacity) || 0),
    0
  );

  const priorityLabel =
    timeWeight <= 2
      ? 'Favor distance'
      : timeWeight >= 6
        ? 'Favor time'
        : 'Balanced';

  /* ------------------------------------------------------------------------ */
  /* Fleet controls                                                           */
  /* ------------------------------------------------------------------------ */

  const addFleetType = () => {
    appendFleetType({
      id: `fleet-${Date.now()}`,
      name: `Bus type ${fleetFields.length + 1}`,
      count: 1,
      capacity: 20,
    });

    setIsBusListOpen(true);
  };

  const updateFleetType = (
    index: number,
    field: 'name' | 'count' | 'capacity',
    value: string | number
  ) => {
    if (field === 'name') {
      setValue(`fleetTypes.${index}.name`, String(value), {
        shouldValidate: true,
      });
    }

    if (field === 'count') {
      setValue(`fleetTypes.${index}.count`, value as number, {
        shouldValidate: true,
      });
    }

    if (field === 'capacity') {
      setValue(`fleetTypes.${index}.capacity`, value as number, {
        shouldValidate: true,
      });
    }
  };

  /* ------------------------------------------------------------------------ */
  /* School location                                                          */
  /* ------------------------------------------------------------------------ */

  /**
   * Turns the typed location (coordinates, Plus Code or address) into the
   * school object sent to the backend. This is what makes the map use the
   * location you enter instead of the Flask default.
   */
  const resolveSchool = async (): Promise<SchoolLocation> => {
    const reference: LatLng = sampleData?.school
      ? {
          lat: Number(sampleData.school.lat),
          lng: Number(sampleData.school.lng),
        }
      : DEFAULT_REFERENCE;

    const resolved = await resolveLocation(
      getValues('locationInput'),
      Number.isFinite(reference.lat) && Number.isFinite(reference.lng)
        ? reference
        : DEFAULT_REFERENCE
    );

    setResolvedLabel(
      `${resolved.lat.toFixed(6)}, ${resolved.lng.toFixed(6)}`
    );

    return {
      name: getValues('schoolName')?.trim() || 'School',
      lat: resolved.lat,
      lng: resolved.lng,
    };
  };

  /* ------------------------------------------------------------------------ */
  /* Load real sample data from Flask                                         */
  /* ------------------------------------------------------------------------ */

  const generateSampleStudents = async () => {
    setIsGenerating(true);
    setFormError('');

    try {
      const count = Number(getValues('presetStudentCount'));
      const school = await resolveSchool();

      // A fresh seed makes "Regenerate" produce a different roster.
      const sample = await fetchSampleData(
        count,
        school,
        Date.now() % 100000
      );

      if (
        !sample?.school ||
        !Array.isArray(sample.students)
      ) {
        throw new Error(
          'The backend returned an unexpected sample-data response.'
        );
      }

      setSampleData({
        ...sample,
        school: { ...sample.school, ...school },
      });
      setLoadedSampleCount(count);
      setLoadedLocationKey(locationKey(school));
      setLoadedLocationText(getValues('locationInput').trim());
    } catch (error: unknown) {
      console.error('Unable to generate sample students:', error);

      const apiError = error as {
        response?: {
          data?: {
            error?: string;
          };
        };
        message?: string;
      };

      setFormError(
        apiError.response?.data?.error ||
          apiError.message ||
          'Could not load sample students. Check that Flask is running on port 5001.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Step navigation                                                          */
  /* ------------------------------------------------------------------------ */

  const handleContinue = async () => {
    setFormError('');

    const valid = await trigger([
      'locationInput',
      'fleetTypes',
    ]);

    if (!valid) {
      setIsBusListOpen(true);
      return;
    }

    // Check the location now, so mistakes show up on step 1.
    try {
      await resolveSchool();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Could not resolve the school location.'
      );
      return;
    }

    const currentFleet = getValues('fleetTypes') || [];

    const configuredBuses = currentFleet.reduce(
      (sum, type) => sum + Math.max(0, Number(type.count) || 0),
      0
    );

    if (configuredBuses < 1) {
      setFormError('Configure at least one bus before continuing.');
      return;
    }

    if (configuredBuses > 200) {
      setFormError('The total fleet cannot exceed 200 buses.');
      return;
    }

    setStep(2);
  };

  /* ------------------------------------------------------------------------ */
  /* Actual Flask optimization                                                */
  /* ------------------------------------------------------------------------ */

  const onSubmit = async (data: WizardFormData) => {
    setIsSubmitting(true);
    setFormError('');

    try {
      const fleetTypesForApi = data.fleetTypes
        .filter((type) => Number(type.count) > 0)
        .map((type) => ({
          name: type.name.trim(),
          count: Number(type.count),
          capacity: Number(type.capacity),
        }));

      if (fleetTypesForApi.length === 0) {
        throw new Error('Add at least one bus to your fleet.');
      }

      const configuredBuses = fleetTypesForApi.reduce(
        (sum, type) => sum + type.count,
        0
      );

      if (configuredBuses > 200) {
        throw new Error('The total fleet cannot exceed 200 buses.');
      }

      // The school always comes from the location typed in the form.
      const school = await resolveSchool();

      let students: Array<Record<string, any>>;
      let payloadSchool: Record<string, any> = school;

      if (data.dataSourceType === 'csv') {
        /* ---------------------- CSV / Excel roster ---------------------- */
        const file = (data.uploadedFile as FileList | undefined)?.[0];

        if (!file) {
          throw new Error(
            'Choose a CSV or Excel file before running the optimizer.'
          );
        }

        const roster = await uploadStudentRoster(file, school);

        if (roster.skipped.length > 0) {
          const preview = roster.skipped
            .slice(0, 5)
            .map(
              (row) =>
                `row ${row.row} (${row.student_name}): ${row.message}`
            )
            .join('; ');

          const more =
            roster.skipped.length > 5
              ? `; and ${roster.skipped.length - 5} more`
              : '';

          throw new Error(
            `${roster.skipped.length} of ${roster.totalRows} students could not be located. ${preview}${more}. Fix these rows and upload the file again.`
          );
        }

        if (roster.students.length === 0) {
          throw new Error('The file did not contain any usable students.');
        }

        students = roster.students;
      } else {
        /* ---------------------- Preset generator ------------------------ */
        let sample = sampleData;

        if (
          !sample ||
          loadedSampleCount !== Number(data.presetStudentCount) ||
          loadedLocationKey !== locationKey(school)
        ) {
          sample = await fetchSampleData(
            Number(data.presetStudentCount),
            school
          );
        }

        if (
          !sample?.school ||
          !Array.isArray(sample.students)
        ) {
          throw new Error(
            'The backend returned an unexpected sample-data response.'
          );
        }

        // Whatever the backend returned, the typed location wins.
        sample = {
          ...sample,
          school: { ...sample.school, ...school },
        };

        // Custom students typed into the form are added on top of the sample.
        const customStudents = await resolveCustomStudents(
          data.specificStudents,
          { lat: school.lat, lng: school.lng }
        );

        students = [...sample.students, ...customStudents];
        payloadSchool = sample.school;
      }

      if (totalSeats < students.length) {
        throw new Error(
          `Your fleet has ${totalSeats} seats for ${students.length} students. Increase the fleet capacity before running optimization.`
        );
      }

      /*
       * The time slider ranges from 0 to 8.
       * Lower values favor distance; higher values favor time.
       *
       * The backend still controls the actual VRP implementation.
       */
      const payload = {
        school: payloadSchool,
        students,

        maxWalkDistanceM: Number(data.maxWalkDistance),

        fleetTypes: fleetTypesForApi,

        maxRouteDurationMin: Number(data.maxRouteDuration),

        distanceWeight: 8 - Number(data.timeWeight),
        timeWeight: Number(data.timeWeight),

        fuelEfficiencyKmpl: Number(data.fuelEfficiency),
        fuelPricePerLitre: Number(data.fuelPrice),
      };

      const result = await runOptimizer(payload);

      sessionStorage.setItem(
        'routecraft-results',
        JSON.stringify({
          ...result,
          input: payload,
        })
      );

      router.push('/results');
    } catch (error: unknown) {
      console.error('RouteCraft optimization failed:', error);

      const apiError = error as {
        response?: {
          data?: {
            error?: string;
          };
        };
        message?: string;
      };

      setFormError(
        apiError.response?.data?.error ||
          apiError.message ||
          'Optimization failed. Check the Flask backend and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Helpers                                                                  */
  /* ------------------------------------------------------------------------ */

  const displayStudentName = (
    student: Record<string, any>,
    index: number
  ) => {
    return (
      student.name ||
      student.student_name ||
      student.studentName ||
      `Student ${index + 1}`
    );
  };

  const displayStudentLocation = (
    student: Record<string, any>
  ) => {
    if (student.landmark) return String(student.landmark);
    if (student.address) return String(student.address);
    if (student.plusCode) return `Plus Code: ${student.plusCode}`;

    if (
      student.lat !== undefined &&
      student.lng !== undefined
    ) {
      return `${student.lat}, ${student.lng}`;
    }

    if (
      student.latitude !== undefined &&
      student.longitude !== undefined
    ) {
      return `${student.latitude}, ${student.longitude}`;
    }

    return 'Location supplied by the demo dataset';
  };

  const rosterIsStale =
    !!sampleData &&
    (loadedSampleCount !== studentCount ||
      loadedLocationText !== currentLocationText);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <section
      id="demo"
      className="relative w-full overflow-hidden border-t border-white/10 bg-bg-grid px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-route-blue/15 via-signal-cyan/15 to-transparent blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-3xl space-y-10 sm:space-y-12">
        {/* Header */}

        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal-cyan/20 bg-signal-cyan/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-signal-cyan">
            <Sparkles className="h-3.5 w-3.5" />
            Route Optimizer
          </div>

          <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-5xl">
            Run Live Route Optimization
          </h2>

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-text-muted sm:text-base">
            Configure your fleet, set safety and route constraints,
            load student data, and calculate optimized bus routes.
          </p>
        </div>

        {/* Main Card */}

        <div className="rounded-3xl border border-white/15 bg-bg-panel/85 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Progress */}

            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-mono ${
                      step === 1
                        ? 'border-signal-cyan/50 bg-signal-cyan/20 text-signal-cyan'
                        : 'border-signal-cyan/40 bg-signal-cyan/20 text-signal-cyan'
                    }`}
                  >
                    {step === 2 ? '✓' : '1'}
                  </div>

                  <div className="h-px w-6 bg-white/15 sm:w-10" />

                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-mono ${
                      step === 2
                        ? 'border-signal-cyan/50 bg-signal-cyan/20 text-signal-cyan'
                        : 'border-white/15 text-text-muted'
                    }`}
                  >
                    2
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-text-primary">
                    {step === 1
                      ? 'Depot & Fleet Setup'
                      : 'Roster & Route Controls'}
                  </p>

                  <p className="mt-0.5 text-[10px] text-text-muted">
                    Step {step} of 2
                  </p>
                </div>
              </div>

              <span className="text-right text-[10px] font-mono text-text-muted">
                {step === 1 ? 'CONFIGURATION' : 'OPTIMIZATION'}
              </span>
            </div>

            {/* ============================================================ */}
            {/* STEP 1: SCHOOL AND FLEET                                      */}
            {/* ============================================================ */}

            {step === 1 && (
              <div className="animate-in space-y-5 fade-in duration-200">
                {/* School Location */}

                <div className="space-y-1.5">
                  <label
                    htmlFor="depot-location"
                    className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-text-muted"
                  >
                    <MapPin className="h-3.5 w-3.5 text-signal-cyan" />
                    School location
                  </label>

                  <input
                    id="depot-location"
                    type="text"
                    autoComplete="off"
                    {...register('locationInput')}
                    placeholder="e.g. 20.9597, 77.7505 or XQ52+V5H Amravati"
                    aria-invalid={!!errors.locationInput}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary transition-all placeholder:text-text-muted/40 focus:border-signal-cyan focus:outline-none focus:ring-1 focus:ring-signal-cyan"
                  />

                  <ErrorMessage>
                    {errors.locationInput?.message}
                  </ErrorMessage>

                  <input
                    type="text"
                    autoComplete="off"
                    {...register('schoolName')}
                    placeholder="School name"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-primary transition-all placeholder:text-text-muted/40 focus:border-signal-cyan focus:outline-none focus:ring-1 focus:ring-signal-cyan"
                  />

                  <p className="text-[10px] leading-relaxed text-text-muted">
                    Enter coordinates (20.9597, 77.7505), a Plus Code with
                    its town, or an address.
                    {resolvedLabel && (
                      <>
                        {' '}
                        Resolved to{' '}
                        <span className="font-mono text-signal-cyan">
                          {resolvedLabel}
                        </span>
                        .
                      </>
                    )}
                  </p>
                </div>

                {/* Fleet Summary */}

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-cyan/10">
                      <Bus className="h-5 w-5 text-signal-cyan" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text-primary">
                        Mixed-capacity fleet
                      </p>
                      <p className="mt-1 text-[10px] text-text-muted">
                        Configure each vehicle type and quantity.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/10 bg-bg-panel p-3">
                      <p className="text-[10px] uppercase tracking-wider text-text-muted">
                        Total buses
                      </p>
                      <p className="mt-1 text-2xl font-bold text-signal-cyan">
                        {totalBuses}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-bg-panel p-3">
                      <p className="text-[10px] uppercase tracking-wider text-text-muted">
                        Total seats
                      </p>
                      <p className="mt-1 text-2xl font-bold text-signal-cyan">
                        {totalSeats}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Collapsible Fleet Editor */}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      setIsBusListOpen((previous) => !previous)
                    }
                    aria-expanded={isBusListOpen}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.04] sm:px-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal-cyan/10">
                        <Sliders className="h-4 w-4 text-signal-cyan" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-text-primary">
                          Fleet configuration
                        </p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          {fleetFields.length} bus types · {totalBuses} vehicles
                        </p>
                      </div>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${
                        isBusListOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isBusListOpen && (
                    <div className="space-y-3">
                      {fleetFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              aria-label={`Bus type ${index + 1} name`}
                              maxLength={24}
                              {...register(
                                `fleetTypes.${index}.name` as const
                              )}
                              placeholder="Bus type name"
                              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-bg-panel px-3 py-2 text-xs text-text-primary outline-none focus:border-signal-cyan"
                            />

                            <button
                              type="button"
                              onClick={() => removeFleetType(index)}
                              disabled={fleetFields.length === 1}
                              aria-label={`Remove ${field.name}`}
                              title="Remove bus type"
                              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <label className="text-[10px] text-text-muted">
                              Number of buses
                              <input
                                type="number"
                                min={0}
                                max={50}
                                value={fleetTypes[index]?.count ?? 0}
                                onChange={(event) => {
                                  const raw = event.target.value;
                                  updateFleetType(
                                    index,
                                    'count',
                                    raw === '' ? 0 : Number(raw)
                                  );
                                }}
                                className="mt-1 w-full rounded-lg border border-white/10 bg-bg-panel px-3 py-2 text-xs text-text-primary outline-none focus:border-signal-cyan"
                              />
                            </label>

                            <label className="text-[10px] text-text-muted">
                              Seats per bus
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={fleetTypes[index]?.capacity ?? 20}
                                onChange={(event) => {
                                  const raw = event.target.value;
                                  updateFleetType(
                                    index,
                                    'capacity',
                                    raw === '' ? 1 : Number(raw)
                                  );
                                }}
                                className="mt-1 w-full rounded-lg border border-white/10 bg-bg-panel px-3 py-2 text-xs text-text-primary outline-none focus:border-signal-cyan"
                              />
                            </label>
                          </div>

                          {(errors.fleetTypes?.[index]?.name ||
                            errors.fleetTypes?.[index]?.count ||
                            errors.fleetTypes?.[index]?.capacity) && (
                            <p className="text-[10px] text-red-400">
                              {errors.fleetTypes[index]?.name?.message ||
                                errors.fleetTypes[index]?.count?.message ||
                                errors.fleetTypes[index]?.capacity?.message}
                            </p>
                          )}

                          <p className="text-[10px] text-text-muted">
                            Subtotal:{' '}
                            {(Number(fleetTypes[index]?.count) || 0) *
                              (Number(fleetTypes[index]?.capacity) || 0)}{' '}
                            seats
                          </p>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addFleetType}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 py-3 text-xs text-text-muted transition-colors hover:border-signal-cyan hover:text-signal-cyan"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add bus type
                      </button>
                    </div>
                  )}
                </div>

                {/* Continue */}

                <button
                  type="button"
                  onClick={handleContinue}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-route-blue via-blue-600 to-route-blue py-3 text-xs font-bold uppercase tracking-wider text-white shadow-glow-blue transition-all hover:opacity-95 active:scale-[0.99]"
                >
                  Save &amp; Continue
                  <ArrowRight className="h-4 w-4 text-signal-cyan" />
                </button>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: DEMAND, SAFETY, ROUTE, FUEL AND OPTIMIZATION          */}
            {/* ============================================================ */}

            {step === 2 && (
              <div className="animate-in space-y-5 fade-in duration-200">
                {/* Demand */}

                <SectionLabel>Demand</SectionLabel>

                {/* The slider only applies to the preset generator. */}
                {!isCsvMode && (
                  <Field
                    icon={<Users className="h-3.5 w-3.5" />}
                    label="Demo student count"
                    value={`${studentCount} students`}
                  >
                    <input
                      type="range"
                      min={10}
                      max={300}
                      step={10}
                      {...register('presetStudentCount', {
                        valueAsNumber: true,
                      })}
                      className="range-amber w-full cursor-pointer accent-cyan-400"
                    />

                    <div className="flex justify-between text-[10px] font-mono text-text-muted">
                      <span>10</span>
                      <span>150</span>
                      <span>300 students</span>
                    </div>
                  </Field>
                )}

                {/* Roster source */}

                <div className="space-y-2">
                  <SectionLabel>Roster input method</SectionLabel>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        setValue('dataSourceType', 'preset', {
                          shouldValidate: true,
                        })
                      }
                      aria-pressed={dataSourceType === 'preset'}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        dataSourceType === 'preset'
                          ? 'border-signal-cyan bg-signal-cyan/10 ring-1 ring-signal-cyan'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <Sliders className="h-5 w-5 shrink-0 text-signal-cyan" />

                      <div>
                        <p className="text-xs font-bold text-text-primary">
                          Preset Generator
                        </p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          Load sample students from Flask
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setValue('dataSourceType', 'csv', {
                          shouldValidate: true,
                        })
                      }
                      aria-pressed={dataSourceType === 'csv'}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        dataSourceType === 'csv'
                          ? 'border-route-blue bg-route-blue/10 ring-1 ring-route-blue'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <FileSpreadsheet className="h-5 w-5 shrink-0 text-route-blue" />

                      <div>
                        <p className="text-xs font-bold text-text-primary">
                          CSV / Excel Upload
                        </p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          Import an existing roster
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {dataSourceType === 'preset' && (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                          Sample student roster
                        </p>

                        <p className="mt-1 text-[10px] text-text-muted">
                          Generated around your school location.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={generateSampleStudents}
                        disabled={isGenerating || isSubmitting}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-signal-cyan/20 bg-signal-cyan/10 px-3 py-2 text-[10px] font-mono text-signal-cyan transition-colors hover:bg-signal-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-signal-cyan border-t-transparent" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}

                        {isGenerating
                          ? 'Loading students...'
                          : sampleData && !rosterIsStale
                            ? 'Regenerate Students'
                            : 'Generate Sample Students'}
                      </button>
                    </div>

                    {sampleData && (
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-bg-panel/70">
                        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
                          <span className="text-xs font-semibold text-text-primary">
                            Loaded roster
                          </span>

                          <span className="text-[10px] font-mono text-signal-cyan">
                            {sampleData.students.length} STUDENTS
                          </span>
                        </div>

                        {rosterIsStale && (
                          <p className="border-b border-white/10 px-3 py-2 text-[10px] text-amber-300">
                            The student count or school location has
                            changed. Generate the sample again to refresh
                            the preview.
                          </p>
                        )}

                        <div className="max-h-64 divide-y divide-white/[0.07] overflow-y-auto">
                          {sampleData.students
                            .slice(0, 30)
                            .map((student, index) => (
                              <div
                                key={
                                  student.id ??
                                  student.student_id ??
                                  `student-${index}`
                                }
                                className="flex items-start gap-3 px-3 py-3"
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-signal-cyan/20 bg-signal-cyan/10 text-[10px] font-mono text-signal-cyan">
                                  {String(index + 1).padStart(2, '0')}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="break-words text-xs font-semibold text-text-primary">
                                    {displayStudentName(student, index)}
                                  </p>

                                  <p className="mt-1 flex items-start gap-1.5 break-words text-[10px] text-text-muted">
                                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-signal-cyan" />
                                    {displayStudentLocation(student)}
                                  </p>
                                </div>
                              </div>
                            ))}

                          {sampleData.students.length > 30 && (
                            <p className="px-3 py-2 text-[10px] text-text-muted">
                              Showing 30 of {sampleData.students.length}{' '}
                              students.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {!sampleData && (
                      <p className="rounded-lg border border-white/10 bg-bg-panel/50 p-3 text-[11px] leading-relaxed text-text-muted">
                        Generate a roster to preview the demo students
                        created around your school location. You can
                        also run optimization directly; the form will
                        fetch the selected number automatically.
                      </p>
                    )}

                    {/* Custom students: each row is resolved to a location
                        and added to the roster when the optimizer runs. */}

                    <div className="space-y-3 border-t border-white/10 pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-mono uppercase text-text-muted">
                            Custom student entries
                          </p>
                          <p className="mt-1 text-[10px] text-text-muted">
                            Added to the roster when you run the optimizer
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            appendStudent({
                              name: '',
                              plusCode: '',
                              landmark: '',
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-mono text-signal-cyan hover:bg-white/10"
                        >
                          <Plus className="h-3 w-3" />
                          Add Student
                        </button>
                      </div>

                      {studentFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
                        >
                          <input
                            type="text"
                            aria-label={`Student ${index + 1} name`}
                            {...register(
                              `specificStudents.${index}.name` as const
                            )}
                            placeholder="Student name"
                            className="min-w-0 rounded-lg border border-white/10 bg-bg-panel px-2.5 py-2 text-xs text-text-primary outline-none focus:border-signal-cyan"
                          />

                          <input
                            type="text"
                            aria-label={`Student ${index + 1} Plus Code`}
                            {...register(
                              `specificStudents.${index}.plusCode` as const
                            )}
                            placeholder="Home Plus Code"
                            className="min-w-0 rounded-lg border border-white/10 bg-bg-panel px-2.5 py-2 text-xs text-text-primary outline-none focus:border-signal-cyan"
                          />

                          <input
                            type="text"
                            aria-label={`Student ${index + 1} landmark`}
                            {...register(
                              `specificStudents.${index}.landmark` as const
                            )}
                            placeholder="Landmark"
                            className="min-w-0 rounded-lg border border-white/10 bg-bg-panel px-2.5 py-2 text-xs text-text-primary outline-none focus:border-signal-cyan"
                          />

                          <button
                            type="button"
                            onClick={() => removeStudent(index)}
                            aria-label={`Remove student ${index + 1}`}
                            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {studentFields.length > 0 && (
                        <p className="text-[10px] leading-relaxed text-text-muted">
                          Custom students are added on top of the sample
                          roster ({studentCount} sample + {customCount}{' '}
                          custom). Their Plus Code or landmark is resolved
                          to a location when you run the optimizer.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {dataSourceType === 'csv' && (
                  <div className="space-y-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-5 text-center">
                    <FileSpreadsheet className="mx-auto h-8 w-8 text-route-blue" />

                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        Upload Student Roster
                      </p>

                      <p className="mt-1 text-[10px] text-text-muted">
                        Supported formats: CSV, XLS, XLSX
                      </p>
                    </div>

                    <p className="text-[10px] leading-relaxed text-text-muted">
                      Expected columns: student_name and plus_code
                      (home_plus_code also works). Short Plus Codes are
                      completed relative to your school location.
                    </p>

                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      {...register('uploadedFile')}
                      className="block w-full cursor-pointer text-xs text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-route-blue/20 file:px-3 file:py-2 file:text-[11px] file:font-mono file:text-route-blue hover:file:bg-route-blue/30"
                    />
                  </div>
                )}

                {/* Safety */}

                <SectionLabel>Safety & capacity constraints</SectionLabel>

                <Field
                  icon={<Footprints className="h-3.5 w-3.5" />}
                  label="Max safe walking distance"
                  value={`${maxWalkDistance} m`}
                >
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={50}
                    {...register('maxWalkDistance', {
                      valueAsNumber: true,
                    })}
                    className="range-amber w-full cursor-pointer accent-cyan-400"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>100 m</span>
                    <span>500 m</span>
                    <span>1000 m</span>
                  </div>
                </Field>

                {/* Route duration */}

                <Field
                  icon={<Timer className="h-3.5 w-3.5" />}
                  label="Max route duration"
                  value={`${maxRouteDuration} min`}
                >
                  <input
                    type="range"
                    min={20}
                    max={120}
                    step={5}
                    {...register('maxRouteDuration', {
                      valueAsNumber: true,
                    })}
                    className="range-amber w-full cursor-pointer accent-cyan-400"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>20 min</span>
                    <span>60 min</span>
                    <span>120 min</span>
                  </div>
                </Field>

                {/* Distance/time priority */}

                <SectionLabel>Multi-objective priority</SectionLabel>

                <Field
                  icon={<Scale className="h-3.5 w-3.5" />}
                  label="Distance ↔ Time priority"
                  value={priorityLabel}
                >
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={1}
                    {...register('timeWeight', {
                      valueAsNumber: true,
                    })}
                    className="range-amber w-full cursor-pointer accent-cyan-400"
                  />

                  <div className="mt-1 flex justify-between gap-2 text-[9px] font-mono text-text-muted">
                    <span>SHORTER ROUTE</span>
                    <span>BALANCED</span>
                    <span>SHORTER RIDE</span>
                  </div>
                </Field>

                {/* Fuel */}

                <SectionLabel>
                  Fuel model (estimated after routing)
                </SectionLabel>

                <Field
                  icon={<Fuel className="h-3.5 w-3.5" />}
                  label="Fuel efficiency"
                  value={`${fuelEfficiency} km/L`}
                >
                  <input
                    type="range"
                    min={3}
                    max={15}
                    step={0.5}
                    {...register('fuelEfficiency', {
                      valueAsNumber: true,
                    })}
                    className="range-amber w-full cursor-pointer accent-cyan-400"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>3 km/L</span>
                    <span>9 km/L</span>
                    <span>15 km/L</span>
                  </div>
                </Field>

                <Field
                  icon={<Fuel className="h-3.5 w-3.5" />}
                  label="Fuel price"
                  value={`₹${fuelPrice} / L`}
                >
                  <input
                    type="range"
                    min={50}
                    max={150}
                    step={5}
                    {...register('fuelPrice', {
                      valueAsNumber: true,
                    })}
                    className="range-amber w-full cursor-pointer accent-cyan-400"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>₹50/L</span>
                    <span>₹100/L</span>
                    <span>₹150/L</span>
                  </div>
                </Field>

                {/* Fleet summary */}

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-signal-cyan" />
                    <p className="text-xs font-semibold text-text-primary">
                      Configuration summary
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <p className="text-text-muted">Students requested</p>
                      <p className="mt-1 font-mono text-text-primary">
                        {isCsvMode ? (
                          <span className="text-[10px] text-text-muted">
                            Counted from the uploaded file
                          </span>
                        ) : (
                          <>
                            {requestedStudents}
                            {customCount > 0 && (
                              <span className="ml-1 text-[10px] text-text-muted">
                                ({studentCount} sample + {customCount} custom)
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-text-muted">Fleet size</p>
                      <p className="mt-1 font-mono text-text-primary">
                        {totalBuses} buses
                      </p>
                    </div>

                    <div>
                      <p className="text-text-muted">Available seats</p>
                      <p className="mt-1 font-mono text-text-primary">
                        {totalSeats}
                      </p>
                    </div>

                    <div>
                      <p className="text-text-muted">Seat surplus</p>
                      <p
                        className={`mt-1 font-mono ${
                          isCsvMode || totalSeats >= requestedStudents
                            ? 'text-signal-cyan'
                            : 'text-red-400'
                        }`}
                      >
                        {isCsvMode ? '—' : totalSeats - requestedStudents}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-text-muted">School location</p>
                      <p className="mt-1 break-words font-mono text-text-primary">
                        {resolvedLabel || currentLocationText}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pipeline */}

                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-[10px] leading-relaxed text-text-muted">
                  <p className="font-mono text-signal-cyan">
                    PIPELINE
                  </p>
                  <p className="mt-1">
                    DBSCAN clustering → walking-distance validation →
                    road-distance matrix → OR-Tools vehicle routing →
                    post-route fuel estimation.
                  </p>
                </div>

                {/* Navigation and submission */}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError('');
                      setStep(1);
                    }}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-mono text-text-primary transition-all hover:bg-white/10 disabled:opacity-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || isGenerating}
                    className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-route-blue via-signal-cyan to-route-blue py-3 text-xs font-bold uppercase tracking-wider text-bg-grid shadow-glow-cyan transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Computing Routes...</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 shrink-0" />
                        <span>Run Route Optimizer</span>
                        <Send className="h-3.5 w-3.5 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* API / validation errors */}

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs leading-relaxed text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{formError}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

export default ContactForm;
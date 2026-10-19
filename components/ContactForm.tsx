
'use client';

import React, { useMemo, useState } from 'react';
import {
  useForm,
  useFieldArray,
  type FieldPath,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bus,
  Check,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  Fuel,
  Gauge,
  MapPin,
  Plus,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';

const wizardSchema = z.object({
  locationInput: z
    .string()
    .trim()
    .min(3, 'Enter a valid Plus Code or latitude/longitude.'),

  fleetSizeCount: z.coerce
    .number()
    .int('Enter a whole number.')
    .min(1, 'At least one bus is required.')
    .max(200, 'Maximum 200 buses.'),

  buses: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().trim().min(1, 'Enter a bus name or ID.'),
        capacity: z.coerce
          .number()
          .int('Capacity must be a whole number.')
          .min(5, 'Minimum capacity is 5 seats.')
          .max(120, 'Maximum capacity is 120 seats.'),
      })
    )
    .min(1, 'Add at least one bus.')
    .max(200, 'Maximum 200 buses.'),

  dataSourceType: z.enum(['preset', 'csv']),

  presetStudentCount: z.coerce
    .number()
    .min(20, 'Minimum 20 students.')
    .max(500, 'Maximum 500 students.'),

  specificStudents: z
    .array(
      z.object({
        name: z.string(),
        plusCode: z.string(),
      })
    )
    .optional(),

  uploadedFile: z.any().optional(),

  optimizationGoal: z.enum(['fuel', 'time', 'capacity']),
});

type WizardFormData = z.infer<typeof wizardSchema>;

const inputClass =
  'w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-text-primary placeholder:text-text-muted/40 transition-colors focus:border-signal-cyan focus:outline-none focus:ring-1 focus:ring-signal-cyan disabled:opacity-50';

const labelClass =
  'flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-text-muted';

const panelClass =
  'rounded-2xl border border-white/10 bg-white/[0.02]';

const createBus = (index: number) => ({
  id: `bus-${Date.now()}-${index}`,
  label: `Bus Unit ${index + 1}`,
  capacity: index % 2 === 0 ? 40 : 30,
});

const objectives = [
  {
    id: 'fuel',
    title: 'Minimum Fuel',
    subtitle: 'Reduce estimated fuel usage',
    icon: Fuel,
    description:
      'Prioritize lower fuel consumption using the routing model.',
    selected:
      'border-bus-yellow bg-bus-yellow/10 text-bus-yellow ring-1 ring-bus-yellow/50',
  },
  {
    id: 'time',
    title: 'Minimum Time',
    subtitle: 'Reduce travel time',
    icon: Zap,
    description:
      'Prioritize shorter estimated travel times across routes.',
    selected:
      'border-signal-cyan bg-signal-cyan/10 text-signal-cyan ring-1 ring-signal-cyan/50',
  },
  {
    id: 'capacity',
    title: 'Seat Utilization',
    subtitle: 'Use seats efficiently',
    icon: Gauge,
    description:
      'Prioritize efficient use of bus capacity while respecting seat limits.',
    selected:
      'border-route-blue bg-route-blue/10 text-route-blue ring-1 ring-route-blue/50',
  },
] as const;

export function ContactForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    getValues,
    setError,
    clearErrors,
    reset,
    formState: { errors, isDirty },
  } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: 'onTouched',
    defaultValues: {
      locationInput: '7JVM+W4 Amravati, Maharashtra',
      fleetSizeCount: 3,
      buses: [
        { id: '1', label: 'Bus Unit Alpha', capacity: 40 },
        { id: '2', label: 'Bus Unit Beta', capacity: 30 },
        { id: '3', label: 'Bus Unit Gamma', capacity: 50 },
      ],
      dataSourceType: 'preset',
      presetStudentCount: 75,
      specificStudents: [],
      optimizationGoal: 'time',
    },
  });

  const {
    fields: busFields,
    append: appendBus,
    remove: removeBus,
  } = useFieldArray({
    control,
    name: 'buses',
  });

  const {
    fields: studentFields,
    append: appendStudent,
    remove: removeStudent,
  } = useFieldArray({
    control,
    name: 'specificStudents',
  });

  const dataSourceType = watch('dataSourceType');
  const optimizationGoal = watch('optimizationGoal');
  const buses = watch('buses');
  const fleetCount = watch('fleetSizeCount');

  const totalSeats = useMemo(
    () =>
      (buses ?? []).reduce(
        (total, bus) => total + (Number(bus.capacity) || 0),
        0
      ),
    [buses]
  );

  // Keep the displayed fleet count synchronized with bus rows.
  const syncFleetCount = (count: number) => {
    if (!Number.isInteger(count) || count < 1 || count > 200) return;

    const currentCount = getValues('buses').length;

    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        appendBus(createBus(i));
      }
    } else if (count < currentCount) {
      for (let i = currentCount - 1; i >= count; i--) {
        removeBus(i);
      }
    }

    setValue('fleetSizeCount', count, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleFleetCountBlur = (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    const count = Number(e.target.value);

    if (Number.isInteger(count) && count >= 1 && count <= 200) {
      syncFleetCount(count);
    }
  };

  const addBus = () => {
    if (busFields.length >= 200) return;

    const index = busFields.length;

    appendBus(createBus(index));

    setValue('fleetSizeCount', index + 1, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const deleteBus = (index: number) => {
    if (busFields.length <= 1) return;

    removeBus(index);

    setValue('fleetSizeCount', busFields.length - 1, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const goToStepTwo = async () => {
    const valid = await trigger([
      'locationInput',
      'fleetSizeCount',
      'buses',
    ]);

    if (!valid) return;

    if (getValues('buses').length !== Number(getValues('fleetSizeCount'))) {
      setError('fleetSizeCount', {
        type: 'manual',
        message: 'Fleet count must match the number of configured buses.',
      });
      return;
    }

    setStep(2);
    setSubmitError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: WizardFormData) => {
    setSubmitError('');
    clearErrors();

    if (data.dataSourceType === 'csv') {
      const file = data.uploadedFile?.[0] as File | undefined;

      if (!file) {
        setError('uploadedFile', {
          type: 'manual',
          message: 'Select a CSV or Excel roster file.',
        });
        return;
      }

      const validExtension = /\.(csv|xlsx|xls)$/i.test(file.name);

      if (!validExtension) {
        setError('uploadedFile', {
          type: 'manual',
          message: 'Upload a CSV, XLSX, or XLS file.',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      /*
       * Demo behavior: replace this simulation with your real API call.
       * Example:
       * const response = await fetch('/api/optimize-routes', {
       *   method: 'POST',
       *   body: formData,
       * });
       *
       * For Excel/CSV uploads, use FormData and append the actual File.
       * Do not JSON.stringify the File object.
       */

      await new Promise((resolve) => setTimeout(resolve, 1200));

      console.log('Demo optimization configuration:', {
        ...data,
        uploadedFile:
          data.dataSourceType === 'csv'
            ? data.uploadedFile?.[0]?.name
            : undefined,
      });

      setIsCompleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSubmitError(
        'Unable to complete the request. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    reset();
    setStep(1);
    setIsCompleted(false);
    setIsSubmitting(false);
    setSubmitError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ErrorMessage = ({ message }: { message?: string }) =>
    message ? (
      <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-400">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{message}</span>
      </p>
    ) : null;

  return (
    <section
      id="demo"
      className="relative w-full overflow-hidden border-t border-white/10 bg-bg-grid px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      {/* Preserve the existing site theme and background glow. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-route-blue/15 via-signal-cyan/15 to-transparent blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-3xl space-y-7">
        {/* Header */}
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal-cyan/20 bg-signal-cyan/10 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest text-signal-cyan">
            <Sparkles className="h-3.5 w-3.5" />
            Spatial Solver Sandbox
          </div>

          <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl">
            Configure Your Fleet
          </h2>

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-text-muted sm:text-base">
            Set up your depot, configure bus capacities, import student
            locations, and choose your route optimization objective.
          </p>
        </header>

        {/* Main panel */}
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-bg-panel/90 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:rounded-3xl">
          {isCompleted ? (
            <div className="space-y-6 px-5 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-signal-cyan/40 bg-signal-cyan/10 text-signal-cyan">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div className="space-y-2">
                <h3 className="font-heading text-2xl font-bold text-text-primary">
                  Demo Configuration Complete
                </h3>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-text-muted">
                  Your configuration passed the demo submission flow. Connect
                  your routing API to calculate actual routes and solver metrics.
                </p>
              </div>

              <div className={`${panelClass} mx-auto max-w-md space-y-3 p-4 text-left`}>
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <ShieldCheck className="h-4 w-4 text-signal-cyan" />
                  <span className="text-xs font-mono font-bold text-text-primary">
                    CONFIGURATION SUMMARY
                  </span>
                </div>

                {[
                  ['Depot', getValues('locationInput')],
                  ['Fleet', `${getValues('buses').length} buses`],
                  [
                    'Total seats',
                    `${getValues('buses').reduce((n, bus) => n + Number(bus.capacity), 0)} seats`,
                  ],
                  [
                    'Roster',
                    getValues('dataSourceType') === 'preset'
                      ? `${getValues('presetStudentCount')} generated students`
                      : getValues('uploadedFile')?.[0]?.name ?? 'Uploaded file',
                  ],
                  ['Objective', objectives.find((o) => o.id === getValues('optimizationGoal'))?.title ?? 'Not selected'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 text-xs">
                    <span className="text-text-muted">{label}</span>
                    <span className="max-w-[65%] break-words text-right font-medium text-text-primary">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={resetWizard}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-text-primary transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan"
              >
                <ArrowLeft className="h-4 w-4" />
                Start a New Configuration
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col"
            >
              {/* Stepper */}
              <div className="border-b border-white/10 px-5 py-5 sm:px-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
                      Setup wizard
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                      Step {step} of 2
                    </p>
                  </div>
                  <span className="rounded-full border border-signal-cyan/20 bg-signal-cyan/10 px-2.5 py-1 text-[10px] font-mono text-signal-cyan">
                    {step === 1 ? 'FLEET SETUP' : 'ROSTER SETUP'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 1, title: 'Depot & Fleet', icon: Bus },
                    { id: 2, title: 'Roster & Objectives', icon: Users },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = step === item.id;
                    const completed = step > item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          if (item.id === 1) setStep(1);
                          else if (step === 1) void goToStepTwo();
                        }}
                        className={`flex min-w-0 items-center gap-2.5 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan ${
                          active
                            ? 'border-signal-cyan/60 bg-signal-cyan/10'
                            : completed
                              ? 'border-signal-cyan/20 bg-white/[0.02]'
                              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            active || completed
                              ? 'bg-signal-cyan/15 text-signal-cyan'
                              : 'bg-white/5 text-text-muted'
                          }`}
                        >
                          {completed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </span>

                        <span className="min-w-0">
                          <span className="block text-[10px] font-mono text-text-muted">
                            STEP 0{item.id}
                          </span>
                          <span className="mt-0.5 block text-xs font-semibold text-text-primary">
                            {item.title}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form body */}
              <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-7">
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        Depot & Fleet Configuration
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-text-muted">
                        Define the starting depot and configure each bus in your fleet.
                      </p>
                    </div>

                    {/* Depot */}
                    <div className="space-y-2">
                      <label htmlFor="locationInput" className={labelClass}>
                        <MapPin className="h-4 w-4 text-signal-cyan" />
                        Central depot location
                      </label>

                      <p className="text-xs text-text-muted">
                        Enter a Plus Code or latitude, longitude coordinates.
                      </p>

                      <input
                        id="locationInput"
                        autoComplete="off"
                        {...register('locationInput')}
                        placeholder="e.g. 7JVM+W4 or 20.9320, 77.7523"
                        className={inputClass}
                      />

                      <ErrorMessage message={errors.locationInput?.message} />
                    </div>

                    {/* Fleet summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`${panelClass} p-4`}>
                        <div className="flex items-center gap-2 text-text-muted">
                          <Bus className="h-4 w-4 text-bus-yellow" />
                          <span className="text-[10px] font-mono uppercase tracking-wider">
                            Active buses
                          </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tabular-nums text-text-primary">
                          {busFields.length}
                        </p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          Configured units
                        </p>
                      </div>

                      <div className={`${panelClass} p-4`}>
                        <div className="flex items-center gap-2 text-text-muted">
                          <Users className="h-4 w-4 text-signal-cyan" />
                          <span className="text-[10px] font-mono uppercase tracking-wider">
                            Total seats
                          </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold tabular-nums text-signal-cyan">
                          {totalSeats.toLocaleString()}
                        </p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          Across all buses
                        </p>
                      </div>
                    </div>

                    {/* Bus editor */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="space-y-1.5">
                          <label htmlFor="fleetSizeCount" className={labelClass}>
                            Fleet size
                          </label>
                          <input
                            id="fleetSizeCount"
                            type="number"
                            min={1}
                            max={200}
                            {...register('fleetSizeCount', {
                              onBlur: handleFleetCountBlur,
                            })}
                            className={`${inputClass} max-w-32`}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={addBus}
                          disabled={busFields.length >= 200}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-signal-cyan/30 bg-signal-cyan/10 px-3 py-2.5 text-xs font-semibold text-signal-cyan transition hover:bg-signal-cyan/15 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan"
                        >
                          <Plus className="h-4 w-4" />
                          Add bus
                        </button>
                      </div>

                      <ErrorMessage message={errors.fleetSizeCount?.message} />
                      <ErrorMessage message={errors.buses?.message} />

                      <div className="flex items-center justify-between gap-2">
                        <span className={labelClass}>Bus configuration</span>
                        <span className="text-[10px] font-mono text-text-muted">
                          {busFields.length} / 200 units
                        </span>
                      </div>

                      <div className="space-y-2">
                        {busFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-white/20"
                          >
                            <div className="mb-2.5 flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[10px] font-mono text-signal-cyan">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <span className="truncate text-xs font-semibold text-text-primary">
                                  Bus unit {index + 1}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => deleteBus(index)}
                                disabled={busFields.length <= 1}
                                aria-label={`Remove bus ${index + 1}`}
                                title="Remove bus"
                                className="rounded-lg p-1.5 text-text-muted transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-[minmax(0,1fr)_100px] gap-2 sm:grid-cols-[minmax(0,1fr)_130px]">
                              <div className="min-w-0">
                                <label
                                  htmlFor={`bus-label-${index}`}
                                  className="mb-1 block text-[10px] text-text-muted"
                                >
                                  Bus name / ID
                                </label>
                                <input
                                  id={`bus-label-${index}`}
                                  {...register(`buses.${index}.label` as const)}
                                  placeholder="e.g. Bus Alpha"
                                  className="w-full min-w-0 rounded-lg border border-white/10 bg-bg-panel px-2.5 py-2 text-xs text-text-primary focus:border-route-blue focus:outline-none focus:ring-1 focus:ring-route-blue"
                                />
                                <ErrorMessage
                                  message={errors.buses?.[index]?.label?.message}
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`bus-capacity-${index}`}
                                  className="mb-1 block text-[10px] text-text-muted"
                                >
                                  Seats (5–120)
                                </label>
                                <input
                                  id={`bus-capacity-${index}`}
                                  type="number"
                                  min={5}
                                  max={120}
                                  {...register(`buses.${index}.capacity` as const)}
                                  className="w-full min-w-0 rounded-lg border border-white/10 bg-bg-panel px-2.5 py-2 text-xs text-text-primary focus:border-route-blue focus:outline-none focus:ring-1 focus:ring-route-blue"
                                />
                                <ErrorMessage
                                  message={errors.buses?.[index]?.capacity?.message}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] leading-relaxed text-text-muted">
                        Changes to bus count preserve existing bus details where possible.
                        Each bus must have a unique identifier in your final implementation.
                      </p>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        Student Roster & Routing Goals
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-text-muted">
                        Select your student data source and define what the routing engine should prioritize.
                      </p>
                    </div>

                    {/* Data source */}
                    <div className="space-y-2.5">
                      <label className={labelClass}>
                        <Users className="h-4 w-4 text-signal-cyan" />
                        Student data source
                      </label>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                          {
                            id: 'preset',
                            title: 'Preset generator',
                            subtitle: 'Generate sample students',
                            description: 'Best for testing the optimizer.',
                            icon: SlidersHorizontal,
                          },
                          {
                            id: 'csv',
                            title: 'CSV / Excel upload',
                            subtitle: 'Import an existing roster',
                            description: 'Best for real student data.',
                            icon: FileSpreadsheet,
                          },
                        ].map((option) => {
                          const Icon = option.icon;
                          const selected = dataSourceType === option.id;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => {
                                setValue(
                                  'dataSourceType',
                                  option.id as 'preset' | 'csv',
                                  { shouldDirty: true, shouldValidate: true }
                                );
                                clearErrors('uploadedFile');
                              }}
                              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan ${
                                selected
                                  ? 'border-signal-cyan bg-signal-cyan/10 ring-1 ring-signal-cyan/40'
                                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                  selected
                                    ? 'bg-signal-cyan/15 text-signal-cyan'
                                    : 'bg-white/5 text-text-muted'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-text-primary">
                                    {option.title}
                                  </span>
                                  {selected && (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-signal-cyan" />
                                  )}
                                </span>
                                <span className="mt-1 block text-xs text-text-muted">
                                  {option.subtitle}
                                </span>
                                <span className="mt-2 block text-[10px] leading-relaxed text-text-muted/80">
                                  {option.description}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Preset generator */}
                    {dataSourceType === 'preset' && (
                      <div className={`${panelClass} space-y-4 p-4 sm:p-5`}>
                        <div className="space-y-1.5">
                          <label htmlFor="presetStudentCount" className={labelClass}>
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Generated student batch
                          </label>

                          <select
                            id="presetStudentCount"
                            {...register('presetStudentCount')}
                            className={inputClass}
                          >
                            <option value={50}>50 students — Small test</option>
                            <option value={75}>75 students — Standard</option>
                            <option value={100}>100 students — Medium</option>
                            <option value={150}>150 students — Large</option>
                            <option value={250}>250 students — Extra large</option>
                            <option value={500}>500 students — Stress test</option>
                          </select>

                          <p className="text-[10px] text-text-muted">
                            Choose a sample size for testing route performance.
                          </p>
                        </div>

                        <div className="space-y-3 border-t border-white/10 pt-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-text-primary">
                                Custom students
                              </p>
                              <p className="mt-1 text-[10px] text-text-muted">
                                Optionally add known student locations.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                appendStudent({ name: '', plusCode: '' })
                              }
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-signal-cyan transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add student
                            </button>
                          </div>

                          {studentFields.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center">
                              <Users className="mx-auto h-5 w-5 text-text-muted/60" />
                              <p className="mt-2 text-xs text-text-muted">
                                No custom students added.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {studentFields.map((field, index) => (
                                <div
                                  key={field.id}
                                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] gap-2"
                                >
                                  <input
                                    aria-label={`Student ${index + 1} name`}
                                    {...register(`specificStudents.${index}.name` as const)}
                                    placeholder="Student name"
                                    className="w-full min-w-0 rounded-lg border border-white/10 bg-bg-panel px-2.5 py-2 text-xs text-text-primary focus:border-signal-cyan focus:outline-none"
                                  />

                                  <input
                                    aria-label={`Student ${index + 1} Plus Code`}
                                    {...register(`specificStudents.${index}.plusCode` as const)}
                                    placeholder="Plus Code"
                                    className="w-full min-w-0 rounded-lg border border-white/10 bg-bg-panel px-2.5 py-2 text-xs text-text-primary focus:border-signal-cyan focus:outline-none"
                                  />

                                  <button
                                    type="button"
                                    aria-label={`Remove student ${index + 1}`}
                                    onClick={() => removeStudent(index)}
                                    className="flex items-center justify-center rounded-lg text-text-muted transition hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CSV upload */}
                    {dataSourceType === 'csv' && (
                      <div className={`${panelClass} space-y-4 p-4 sm:p-5`}>
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary">
                            Import student roster
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-text-muted">
                            Upload a CSV or Excel file containing student names
                            and home locations.
                          </p>
                        </div>

                        <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-5 text-center transition hover:border-signal-cyan/50">
                          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-route-blue/10 text-route-blue">
                            <FileSpreadsheet className="h-5 w-5" />
                          </div>

                          <p className="mt-3 text-xs font-semibold text-text-primary">
                            Choose your roster file
                          </p>
                          <p className="mt-1 text-[10px] text-text-muted">
                            CSV, XLSX or XLS
                          </p>

                          <input
                            id="uploadedFile"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            {...register('uploadedFile')}
                            onChange={(e) => {
                              setValue('uploadedFile', e.target.files, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              clearErrors('uploadedFile');
                            }}
                            className="mt-4 block w-full cursor-pointer text-xs text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-route-blue/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-route-blue hover:file:bg-route-blue/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan"
                          />

                          {watch('uploadedFile')?.[0] && (
                            <div className="mt-3 flex items-center gap-2 rounded-lg border border-signal-cyan/20 bg-signal-cyan/5 p-2.5 text-left">
                              <FileSpreadsheet className="h-4 w-4 shrink-0 text-signal-cyan" />
                              <span className="min-w-0 flex-1 break-all text-xs text-text-primary">
                                {watch('uploadedFile')[0].name}
                              </span>
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-signal-cyan" />
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl bg-white/[0.03] p-3">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                            Required columns
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <code className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-signal-cyan">
                              student_name
                            </code>
                            <code className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-signal-cyan">
                              home_plus_code
                            </code>
                          </div>
                          <p className="mt-2 text-[10px] leading-relaxed text-text-muted">
                            Ensure your column headers match these names. Actual
                            file parsing and row validation must be handled by your
                            upload-processing logic.
                          </p>
                        </div>

                        <ErrorMessage
                          message={
                            typeof errors.uploadedFile?.message === 'string'
                              ? errors.uploadedFile.message
                              : undefined
                          }
                        />
                      </div>
                    )}

                    {/* Optimization objective */}
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>
                          <Cpu className="h-4 w-4 text-bus-yellow" />
                          Optimization objective
                        </label>
                        <p className="mt-1.5 text-xs text-text-muted">
                          Select the primary goal for your route calculations.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {objectives.map((objective) => {
                          const Icon = objective.icon;
                          const selected = optimizationGoal === objective.id;

                          return (
                            <label
                              key={objective.id}
                              className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition focus-within:ring-2 focus-within:ring-signal-cyan sm:flex-col sm:items-center sm:gap-2 sm:p-4 sm:text-center ${
                                selected
                                  ? objective.selected
                                  : 'border-white/10 bg-white/[0.02] text-text-muted hover:border-white/20 hover:bg-white/[0.04]'
                              }`}
                            >
                              <input
                                type="radio"
                                value={objective.id}
                                {...register('optimizationGoal')}
                                className="sr-only"
                              />

                              <Icon className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" />

                              <span className="min-w-0 flex-1 sm:flex-none">
                                <span className="block text-xs font-bold text-text-primary">
                                  {objective.title}
                                </span>
                                <span className="mt-1 block text-[10px] leading-relaxed text-text-muted">
                                  {objective.subtitle}
                                </span>
                              </span>

                              {selected && (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-signal-cyan sm:absolute sm:right-3 sm:top-3" />
                              )}
                            </label>
                          );
                        })}
                      </div>

                      <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-signal-cyan" />
                        <p className="text-xs leading-relaxed text-text-muted">
                          {objectives.find((o) => o.id === optimizationGoal)?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/5 p-3 text-xs text-red-400"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {submitError}
                  </div>
                )}
              </div>

              {/* Persistent navigation footer */}
              <div className="sticky bottom-0 z-20 border-t border-white/10 bg-bg-panel/95 px-5 py-4 backdrop-blur-xl sm:px-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {step === 1 ? (
                      <p className="text-[10px] leading-relaxed text-text-muted">
                        <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-signal-cyan" />
                        Configure your fleet to continue.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setSubmitError('');
                        }}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-lg py-2 text-xs text-text-muted transition hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Edit fleet
                      </button>
                    )}
                  </div>

                  {step === 1 ? (
                    <button
                      type="button"
                      onClick={() => void goToStepTwo()}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-route-blue via-blue-600 to-route-blue px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-glow-blue transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan sm:px-6"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex min-w-0 shrink items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-route-blue via-blue-600 to-route-blue px-4 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-glow-blue transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-cyan sm:px-6"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Processing…</span>
                        </>
                      ) : (
                        <>
                          <span>Run optimization</span>
                          <Send className="h-3.5 w-3.5 shrink-0" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] leading-relaxed text-text-muted/70">
          RouteCraft · Fleet configuration and route optimization sandbox
        </p>
      </div>
    </section>
  );
}

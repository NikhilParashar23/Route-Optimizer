
'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Send,
  MapPin,
  Bus,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  Sliders,
  Users,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Zap,
  Gauge,
  Fuel,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';

const wizardSchema = z.object({
  locationInput: z
    .string()
    .min(3, 'Enter a valid Plus Code or Lat/Long coordinates'),

  fleetSizeCount: z.coerce
    .number()
    .min(1, 'At least 1 bus is required')
    .max(200, 'Max 200 buses for sandbox'),

  buses: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1, 'Bus identifier required'),
      capacity: z.coerce
        .number()
        .min(5, 'Min capacity 5')
        .max(120, 'Max capacity 120'),
    })
  ),

  dataSourceType: z.enum(['preset', 'csv']),

  presetStudentCount: z.coerce.number().min(20).max(500),

  specificStudents: z.array(
    z.object({
      name: z.string(),
      plusCode: z.string(),
      landmark: z.string(),
    })
  ).optional(),

  uploadedFile: z.any().optional(),

  optimizationGoal: z.enum(['fuel', 'time', 'capacity']),
});

type WizardFormData = z.infer<typeof wizardSchema>;

export function ContactForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isBusListOpen, setIsBusListOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [generatedStudents, setGeneratedStudents] = useState<
    Array<{
      id: string;
      name: string;
      plusCode: string;
      landmark: string;
    }>
  >([]);

  const [rosterGenerated, setRosterGenerated] = useState(false);

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
    replace: replaceBuses,
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
  const presetStudentCount = watch('presetStudentCount');

  const totalSeats = (buses || []).reduce(
    (total, bus) => total + (Number(bus?.capacity) || 0),
    0
  );

  // Keep fleet count and generated bus list synchronized.
  const handleFleetCountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = e.target.value;

    if (rawValue === '') {
      setValue('fleetSizeCount', '' as unknown as number, {
        shouldValidate: true,
      });
      return;
    }

    const value = Number.parseInt(rawValue, 10);

    if (Number.isNaN(value)) return;

    const count = Math.min(200, Math.max(1, value));

    setValue('fleetSizeCount', count, {
      shouldValidate: true,
    });

    const currentBuses = getValues('buses') || [];

    const newBuses = Array.from({ length: count }, (_, index) => ({
      id: currentBuses[index]?.id || String(index + 1),
      label:
        currentBuses[index]?.label || `Bus Unit #${index + 1}`,
      capacity:
        currentBuses[index]?.capacity ??
        (index % 2 === 0 ? 40 : 30),
    }));

    replaceBuses(newBuses);
    setIsBusListOpen(true);
  };

  // Validate Step 1 before moving to Step 2.
  const handleContinue = async () => {
    const isValid = await trigger([
      'locationInput',
      'fleetSizeCount',
      'buses',
    ]);

    if (isValid) {
      setStep(2);
    } else {
      setIsBusListOpen(true);
    }
  };

  const firstNames = [
    'Aarav', 'Ananya', 'Rohan', 'Priya',
    'Vihaan', 'Isha', 'Aditya', 'Saanvi',
    'Arjun', 'Meera', 'Kabir', 'Aditi',
    'Ishaan', 'Kavya', 'Reyansh', 'Diya',
  ];

  const lastNames = [
    'Sharma', 'Patel', 'Gupta', 'Verma',
    'Joshi', 'Deshmukh', 'Kulkarni', 'Shah',
    'Pawar', 'Jadhav', 'Singh', 'Kale',
  ];

  const landmarks = [
    'Near Ganpati Temple Gate',
    'Kothrud Bus Stop',
    'Shivaji Nagar Square',
    'Kalyani Nagar Main Road',
    'Hadapsar Market',
    'Near City Library',
    'Main Road Bus Shelter',
    'Near Central Park',
    'School Road Junction',
    'Near Community Hall',
    'Market Chowk',
    'Railway Station Road',
  ];

  const plusCodePrefixes = [
    '8J6V', '8J22', '8J4F', '8J6W', '7JXR',
    '8J5P', '8JVM', '8J3K', '7JVP', '8J7R',
  ];

  const generateStudentRoster = () => {
    const count = Number(getValues('presetStudentCount')) || 75;

    const generated = Array.from({ length: count }, (_, index) => {
      const first =
        firstNames[Math.floor(Math.random() * firstNames.length)];

      const last =
        lastNames[Math.floor(Math.random() * lastNames.length)];

      const prefix =
        plusCodePrefixes[
          Math.floor(Math.random() * plusCodePrefixes.length)
        ];

      const suffix = `${Math.floor(Math.random() * 9)}${
        ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'J', 'M', 'P', 'R', 'W'][
          Math.floor(Math.random() * 12)
        ]
      }${Math.floor(Math.random() * 9)}${
        ['X', 'Y', 'M', 'Q', 'R', 'W', 'C'][
          Math.floor(Math.random() * 7)
        ]
      }`;

      return {
        id: `demo-${Date.now()}-${index}`,
        name: `${first} ${last}`,
        plusCode: `${prefix}+${suffix}`,
        landmark:
          landmarks[Math.floor(Math.random() * landmarks.length)],
      };
    });

    setGeneratedStudents(generated);
    setRosterGenerated(true);
  };

  const onSubmit = async (data: WizardFormData) => {
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('Optimized Routing Simulation Payload:', {
        ...data,
        generatedStudents:
          data.dataSourceType === 'preset' ? generatedStudents : [],
      });

      setIsCompleted(true);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSimulation = () => {
    setIsCompleted(false);
    setStep(1);
    setIsBusListOpen(false);
    setGeneratedStudents([]);
    setRosterGenerated(false);
  };

  return (
    <section
      id="demo"
      className="relative w-full bg-bg-grid py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-route-blue/15 via-signal-cyan/15 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* UPDATED: Increased vertical spacing between header and card */}
      <div className="max-w-3xl mx-auto relative z-10 space-y-10 sm:space-y-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal-cyan/10 border border-signal-cyan/20 text-signal-cyan text-[11px] font-mono tracking-widest uppercase shadow-glow-cyan/20">
            <Sparkles className="w-3.5 h-3.5" />
            Route Optimizer
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-text-primary tracking-tight leading-tight">
            Run Live Route Optimization
          </h2>

          <p className="text-sm sm:text-base text-text-muted max-w-xl mx-auto leading-relaxed">
            Set your school location, enter bus capacity, upload
            your student data, and instantly calculate optimized routes.
          </p>
        </div>

        {/* Main Card */}
        <div className="p-4 sm:p-8 rounded-3xl bg-bg-panel/85 border border-white/15 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">

          {isCompleted ? (
            /* Completion Screen */
            <div className="py-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-signal-cyan/20 to-route-blue/20 border border-signal-cyan/40 text-signal-cyan flex items-center justify-center mx-auto shadow-glow-cyan">
                <Cpu className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-heading font-bold text-text-primary">
                  Optimization Complete!
                </h3>

                <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
                  Spatial clustering and route optimization simulation
                  finished successfully.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 max-w-md mx-auto text-left space-y-3 text-xs font-mono text-text-muted">

                <div className="flex items-center justify-between border-b border-white/10 pb-2 text-signal-cyan font-bold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    SOLVER METRICS
                  </span>

                  <span className="text-[10px] uppercase">
                    Status: OK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-white/50">Fleet Size:</span>
                    <strong className="text-text-primary ml-1">
                      {getValues('fleetSizeCount')} buses
                    </strong>
                  </div>

                  <div>
                    <span className="text-white/50">Total Seats:</span>
                    <strong className="text-text-primary ml-1">
                      {totalSeats}
                    </strong>
                  </div>

                  <div>
                    <span className="text-white/50">Algorithm:</span>
                    <strong className="text-text-primary ml-1">
                      OR-Tools
                    </strong>
                  </div>

                  <div>
                    <span className="text-white/50">Objective:</span>
                    <strong className="text-text-primary ml-1">
                      {optimizationGoal}
                    </strong>
                  </div>
                </div>

                <p className="text-[10px] text-text-muted/70">
                  Demo metrics only. Connect the actual optimization
                  backend to display measured results.
                </p>
              </div>

              <button
                type="button"
                onClick={resetSimulation}
                className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-text-primary transition-all"
              >
                Reset &amp; New Simulation
              </button>
            </div>
          ) : (
            /* Two-Step Wizard */
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >

              {/* Progress Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-mono ${
                        step === 1
                          ? 'bg-signal-cyan/20 border-signal-cyan/50 text-signal-cyan'
                          : 'bg-signal-cyan/20 border-signal-cyan/40 text-signal-cyan'
                      }`}
                    >
                      {step === 2 ? '✓' : '1'}
                    </div>

                    <div className="w-6 sm:w-10 h-px bg-white/15" />

                    <div
                      className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-mono ${
                        step === 2
                          ? 'bg-signal-cyan/20 border-signal-cyan/50 text-signal-cyan'
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
                        : 'Roster & Objectives'}
                    </p>

                    <p className="text-[10px] text-text-muted mt-0.5">
                      Step {step} of 2
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-text-muted">
                  {step === 1 ? 'CONFIGURATION' : 'OPTIMIZATION'}
                </span>
              </div>

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">

                 {/* School Location */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="depot-location"
                      className="text-[11px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-signal-cyan" />
                      School location
                    </label>

                    <input
                      id="depot-location"
                      type="text"
                      autoComplete="off"
                      {...register('locationInput')}
                      placeholder="e.g. 7JVM+W4 Amravati or 20.9320, 77.7523"
                      aria-invalid={!!errors.locationInput}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-signal-cyan focus:ring-1 focus:ring-signal-cyan transition-all"
                    />

                    {errors.locationInput && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors.locationInput.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Fleet Count */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="fleet-count"
                      className="text-[11px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <Bus className="w-3.5 h-3.5 text-bus-yellow" />
                      Total Capacity
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        id="fleet-count"
                        type="number"
                        min={1}
                        max={200}
                        {...register('fleetSizeCount', {
                          onChange: handleFleetCountChange,
                        })}
                        aria-invalid={!!errors.fleetSizeCount}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-text-primary focus:outline-none focus:border-bus-yellow focus:ring-1 focus:ring-bus-yellow transition-all"
                      />

                      <span className="shrink-0 text-xs text-text-muted">
                        buses
                      </span>
                    </div>

                    {errors.fleetSizeCount && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {errors.fleetSizeCount.message}
                      </p>
                    )}
                  </div>

                  {/* Collapsible Bus Capacity Section */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsBusListOpen((prev) => !prev)}
                      aria-expanded={isBusListOpen}
                      aria-controls="bus-capacity-panel"
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 px-3 sm:px-4 py-3 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-signal-cyan/10 flex items-center justify-center shrink-0">
                          <Bus className="w-4 h-4 text-signal-cyan" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary">
                            Individual Bus Capacity
                          </p>

                          <p className="text-[10px] text-text-muted mt-1">
                            {busFields.length} buses · {totalSeats} total seats
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-signal-cyan bg-signal-cyan/10 border border-signal-cyan/20 px-2 py-1 rounded-full">
                          {isBusListOpen ? 'Hide buses' : 'Edit buses'}
                        </span>

                        <ChevronDown
                          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                            isBusListOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isBusListOpen && (
                      <div
                        id="bus-capacity-panel"
                        className="space-y-2 pl-2 border-l-2 border-signal-cyan/30 animate-in fade-in slide-in-from-top-1 duration-200"
                      >

                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {busFields.map((field, index) => (
                            <div
                              key={field.id}
                              className="grid grid-cols-12 gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/10 items-center"
                            >
                              <div className="col-span-7">
                                <label
                                  htmlFor={`bus-label-${field.id}`}
                                  className="sr-only"
                                >
                                  Bus {index + 1} identifier
                                </label>

                                <input
                                  id={`bus-label-${field.id}`}
                                  type="text"
                                  {...register(`buses.${index}.label` as const)}
                                  placeholder={`Bus ${index + 1} name`}
                                  aria-invalid={!!errors.buses?.[index]?.label}
                                  className="w-full min-w-0 px-3 py-2 rounded-lg bg-bg-panel border border-white/10 text-xs text-text-primary focus:outline-none focus:border-signal-cyan"
                                />
                              </div>

                              <div className="col-span-5 flex items-center gap-1">
                                <label
                                  htmlFor={`bus-capacity-${field.id}`}
                                  className="sr-only"
                                >
                                  Bus {index + 1} seat capacity
                                </label>

                                <input
                                  id={`bus-capacity-${field.id}`}
                                  type="number"
                                  min={5}
                                  max={120}
                                  {...register(`buses.${index}.capacity` as const)}
                                  placeholder="Seats"
                                  aria-invalid={!!errors.buses?.[index]?.capacity}
                                  className="w-full min-w-0 px-2 sm:px-3 py-2 rounded-lg bg-bg-panel border border-white/10 text-xs text-text-primary focus:outline-none focus:border-signal-cyan"
                                />

                                <span className="text-[9px] font-mono text-text-muted">
                                  seats
                                </span>
                              </div>

                              {(errors.buses?.[index]?.label ||
                                errors.buses?.[index]?.capacity) && (
                                <p className="col-span-12 text-[10px] text-red-400 px-1">
                                  {errors.buses[index]?.label?.message ||
                                    errors.buses[index]?.capacity?.message}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Continue */}
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-route-blue via-blue-600 to-route-blue hover:from-blue-600 hover:to-route-blue text-white font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-glow-blue flex items-center justify-center gap-2 hover:scale-[1.005] active:scale-[0.98]"
                  >
                    Save &amp; Continue
                    <ArrowRight className="w-4 h-4 text-signal-cyan" />
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">

                  {/* Roster Source */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-signal-cyan" />
                      Roster Input Method
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setValue('dataSourceType', 'preset', {
                            shouldValidate: true,
                          })
                        }
                        aria-pressed={dataSourceType === 'preset'}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          dataSourceType === 'preset'
                            ? 'bg-signal-cyan/10 border-signal-cyan text-signal-cyan ring-1 ring-signal-cyan shadow-glow-cyan/20'
                            : 'bg-white/[0.02] border-white/10 text-text-muted hover:bg-white/[0.04]'
                        }`}
                      >
                        <Sliders className="w-5 h-5 shrink-0" />

                        <div>
                          <p className="text-xs font-bold text-text-primary">
                            Preset Generator
                          </p>
                          <p className="text-[10px] text-text-muted mt-1">
                            Generate sample students
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
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          dataSourceType === 'csv'
                            ? 'bg-route-blue/10 border-route-blue text-route-blue ring-1 ring-route-blue shadow-glow-blue/20'
                            : 'bg-white/[0.02] border-white/10 text-text-muted hover:bg-white/[0.04]'
                        }`}
                      >
                        <FileSpreadsheet className="w-5 h-5 shrink-0" />

                        <div>
                          <p className="text-xs font-bold text-text-primary">
                            CSV / Excel Upload
                          </p>
                          <p className="text-[10px] text-text-muted mt-1">
                            Import an existing roster
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Preset Configuration */}
                  {dataSourceType === 'preset' && (
                    <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="student-batch-size"
                          className="text-[10px] font-mono text-text-muted uppercase tracking-wider"
                        >
                          Student Batch Size
                        </label>

                        <select
                          id="student-batch-size"
                          {...register('presetStudentCount')}
                          className="w-full px-3 py-2.5 rounded-xl bg-bg-panel border border-white/10 text-xs text-text-primary focus:outline-none focus:border-signal-cyan"
                        >
                          <option value={50}>50 Students · Small Test</option>
                          <option value={75}>75 Students · Standard</option>
                          <option value={100}>100 Students · Medium</option>
                          <option value={150}>150 Students · Large Cluster</option>
                        </select>
                      </div>

                      {/* Generated Demo Roster */}
                      <div className="space-y-3 pt-3 border-t border-white/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                              Generated Student Roster
                            </p>
                            <p className="text-[10px] text-text-muted mt-1">
                              Random demo names, Plus Codes and pickup landmarks
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={generateStudentRoster}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-signal-cyan/10 hover:bg-signal-cyan/20 text-[10px] font-mono text-signal-cyan border border-signal-cyan/20 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {rosterGenerated
                              ? 'Regenerate Students'
                              : `Generate ${presetStudentCount} Students`}
                          </button>
                        </div>

                        {rosterGenerated && (
                          <div className="rounded-xl border border-white/10 bg-bg-panel/70 overflow-hidden">
                            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-white/[0.02]">
                              <span className="text-xs font-semibold text-text-primary">
                                Pickup Roster
                              </span>
                              <span className="text-[10px] font-mono text-signal-cyan">
                                {generatedStudents.length} SAMPLE RECORDS
                              </span>
                            </div>

                            <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.07] custom-scrollbar">
                              {generatedStudents.map((student, index) => (
                                <div
                                  key={student.id}
                                  className="flex items-start gap-3 px-3 py-3 hover:bg-white/[0.025] transition-colors"
                                >
                                  <div className="w-7 h-7 shrink-0 rounded-lg bg-signal-cyan/10 border border-signal-cyan/20 flex items-center justify-center text-[10px] font-mono text-signal-cyan">
                                    {String(index + 1).padStart(2, '0')}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-text-primary break-words">
                                      {student.name}
                                    </p>

                                    <p className="mt-1 text-[10px] text-text-muted flex items-start gap-1.5">
                                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-signal-cyan" />
                                      {student.landmark}
                                    </p>

                                    <span className="inline-flex mt-2 rounded-md border border-signal-cyan/20 bg-signal-cyan/5 px-2 py-1 text-[10px] font-mono text-signal-cyan">
                                      Plus Code: {student.plusCode}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <p className="px-3 py-2 text-[10px] text-text-muted border-t border-white/10">
                              Demo data only · Scroll to view all generated students
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Optional Custom Students */}
                      <div className="space-y-2 pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center gap-2">
                          <div>
                            <p className="text-[10px] font-mono text-text-muted uppercase">
                              Custom Students
                            </p>
                            <p className="text-[10px] text-text-muted mt-1">
                              Optional · Add specific locations
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-signal-cyan border border-white/10"
                          >
                            <Plus className="w-3 h-3" />
                            Add Student
                          </button>
                        </div>

                        {studentFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center"
                          >
                            <input
                              type="text"
                              aria-label={`Student ${index + 1} name`}
                              {...register(`specificStudents.${index}.name` as const)}
                              placeholder="Student name"
                              className="min-w-0 w-full px-2.5 py-2 rounded-lg bg-bg-panel border border-white/10 text-xs text-text-primary focus:outline-none focus:border-signal-cyan"
                            />

                            <input
                              type="text"
                              aria-label={`Student ${index + 1} Plus Code`}
                              {...register(`specificStudents.${index}.plusCode` as const)}
                              placeholder="Home Plus Code"
                              className="min-w-0 w-full px-2.5 py-2 rounded-lg bg-bg-panel border border-white/10 text-xs text-text-primary focus:outline-none focus:border-signal-cyan"
                            />

                            <input
                              type="text"
                              aria-label={`Student ${index + 1} landmark`}
                              {...register(`specificStudents.${index}.landmark` as const)}
                              placeholder="Landmark / stop"
                              className="min-w-0 w-full px-2.5 py-2 rounded-lg bg-bg-panel border border-white/10 text-xs text-text-primary focus:outline-none focus:border-signal-cyan"
                            />

                            <button
                              type="button"
                              onClick={() => removeStudent(index)}
                              aria-label={`Remove student ${index + 1}`}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CSV Upload */}
                  {dataSourceType === 'csv' && (
                    <div className="space-y-3 p-5 rounded-2xl bg-white/[0.02] border border-dashed border-white/20 text-center">
                      <FileSpreadsheet className="w-8 h-8 text-route-blue mx-auto" />

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-text-primary">
                          Upload Student Roster
                        </p>
                        <p className="text-[10px] text-text-muted">
                          Supported formats: CSV, XLS, XLSX
                        </p>
                      </div>

                      <p className="text-[10px] text-text-muted">
                        Required columns:{' '}
                        <code className="text-signal-cyan">student_name</code>
                        {' and '}
                        <code className="text-signal-cyan">home_plus_code</code>
                      </p>

                      <input
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        {...register('uploadedFile')}
                        className="block w-full text-xs text-text-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-mono file:bg-route-blue/20 file:text-route-blue hover:file:bg-route-blue/30 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Optimization Goal */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-bus-yellow" />
                      Optimization Objective
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <label
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex sm:flex-col items-center justify-center gap-3 sm:gap-1 ${
                          optimizationGoal === 'fuel'
                            ? 'bg-bus-yellow/10 border-bus-yellow text-bus-yellow ring-1 ring-bus-yellow'
                            : 'bg-white/[0.02] border-white/10 text-text-muted hover:bg-white/[0.04]'
                        }`}
                      >
                        <input
                          type="radio"
                          value="fuel"
                          {...register('optimizationGoal')}
                          className="sr-only"
                        />

                        <Fuel className="w-4 h-4" />

                        <span className="text-xs font-bold text-text-primary">
                          Min Fuel
                        </span>

                        <span className="text-[9px] opacity-75">
                          Reduce distance
                        </span>
                      </label>

                      <label
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex sm:flex-col items-center justify-center gap-3 sm:gap-1 ${
                          optimizationGoal === 'time'
                            ? 'bg-signal-cyan/10 border-signal-cyan text-signal-cyan ring-1 ring-signal-cyan'
                            : 'bg-white/[0.02] border-white/10 text-text-muted hover:bg-white/[0.04]'
                        }`}
                      >
                        <input
                          type="radio"
                          value="time"
                          {...register('optimizationGoal')}
                          className="sr-only"
                        />

                        <Zap className="w-4 h-4" />

                        <span className="text-xs font-bold text-text-primary">
                          Min Time
                        </span>

                        <span className="text-[9px] opacity-75">
                          Faster routes
                        </span>
                      </label>

                      <label
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex sm:flex-col items-center justify-center gap-3 sm:gap-1 ${
                          optimizationGoal === 'capacity'
                            ? 'bg-route-blue/10 border-route-blue text-route-blue ring-1 ring-route-blue'
                            : 'bg-white/[0.02] border-white/10 text-text-muted hover:bg-white/[0.04]'
                        }`}
                      >
                        <input
                          type="radio"
                          value="capacity"
                          {...register('optimizationGoal')}
                          className="sr-only"
                        />

                        <Gauge className="w-4 h-4" />

                        <span className="text-xs font-bold text-text-primary">
                          Max Capacity
                        </span>

                        <span className="text-[9px] opacity-75">
                          Better seat usage
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-text-primary transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 min-w-0 py-3 rounded-xl bg-gradient-to-r from-route-blue via-signal-cyan to-route-blue hover:opacity-95 text-bg-grid font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Computing Routes...</span>
                        </>
                      ) : (
                        <>
                          <span>Run Optimization</span>
                          <Send className="w-3.5 h-3.5 shrink-0" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
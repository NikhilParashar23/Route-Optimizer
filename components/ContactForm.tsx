'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Send,
  CheckCircle2,
  AlertCircle,
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
} from 'lucide-react';

const wizardSchema = z.object({
  locationInput: z.string().min(3, 'Enter a valid Plus Code or Lat/Long coordinates'),
  fleetSizeCount: z.coerce.number().min(1, 'At least 1 bus is required').max(200, 'Max 200 buses for sandbox'),
  buses: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1, 'Bus identifier required'),
      capacity: z.coerce.number().min(5, 'Min capacity 5').max(120, 'Max capacity 120'),
    })
  ),
  dataSourceType: z.enum(['preset', 'csv']),
  presetStudentCount: z.coerce.number().min(20).max(500),
  specificStudents: z.array(
    z.object({
      name: z.string(),
      plusCode: z.string(),
    })
  ).optional(),
  uploadedFile: z.any().optional(),
  optimizationGoal: z.enum(['fuel', 'time', 'capacity']),
});

type WizardFormData = z.infer<typeof wizardSchema>;

export function ContactForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
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

  const { fields: busFields, replace: replaceBuses } = useFieldArray({
    control,
    name: 'buses',
  });

  const { fields: studentFields, append: appendStudent, remove: removeStudent } = useFieldArray({
    control,
    name: 'specificStudents',
  });

  const dataSourceType = watch('dataSourceType');
  const optimizationGoal = watch('optimizationGoal');

  const handleFleetCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setValue('fleetSizeCount', val);
    const newBuses = Array.from({ length: val }, (_, index) => ({
      id: String(index + 1),
      label: `Bus Unit #${index + 1}`,
      capacity: index % 2 === 0 ? 40 : 30,
    }));
    replaceBuses(newBuses);
  };

  const onSubmit = async (data: WizardFormData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Optimized Routing Simulation Payload:', data);
    setIsSubmitting(false);
    setIsCompleted(true);
  };

  return (
    <section id="demo" className="relative w-full bg-bg-grid py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10 overflow-hidden select-none">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-route-blue/15 via-signal-cyan/15 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10 space-y-8">
        
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal-cyan/10 border border-signal-cyan/20 text-signal-cyan text-[11px] font-mono tracking-widest uppercase shadow-glow-cyan/20">
            <Sparkles className="w-3.5 h-3.5" /> Spatial Solver Sandbox
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-text-primary tracking-tight leading-tight">
            Run Live Route Optimization
          </h2>

          <p className="text-sm sm:text-base text-text-muted max-w-xl mx-auto leading-relaxed">
            Configure depot coordinates, set fleet capacities, import student rosters, and launch Google OR-Tools spatial algorithms.
          </p>
        </div>

        {/* Main Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-bg-panel/85 border border-white/15 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {isCompleted ? (
            /* Execution Complete Screen */
            <div className="py-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-signal-cyan/20 to-route-blue/20 border border-signal-cyan/40 text-signal-cyan flex items-center justify-center mx-auto shadow-glow-cyan">
                <Cpu className="w-10 h-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-heading font-bold text-text-primary">
                  Optimization Complete!
                </h3>
                <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
                  Spatial DBSCAN clustering and turn-by-turn trajectory resolution finished in 1.42 seconds.
                </p>
              </div>

              {/* Telemetry Summary Box */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 max-w-md mx-auto text-left space-y-2 text-xs font-mono text-text-muted">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 text-signal-cyan font-bold">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> SOLVER METRICS</span>
                  <span className="text-[10px] text-text-muted uppercase">Status: OK</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div><span className="text-white/50">Mileage Reduced:</span> <strong className="text-signal-cyan">~28.4%</strong></div>
                  <div><span className="text-white/50">Fleet Occupancy:</span> <strong className="text-text-primary">94.2%</strong></div>
                  <div><span className="text-white/50">Algorithm:</span> <strong className="text-text-primary">OR-Tools</strong></div>
                  <div><span className="text-white/50">Execution Time:</span> <strong className="text-text-primary">1.42s</strong></div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCompleted(false);
                  setStep(1);
                }}
                className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-text-primary transition-all hover:scale-105 active:scale-95"
              >
                Reset & New Simulation
              </button>
            </div>
          ) : (
            /* Wizard Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              
              {/* Progress Stepper Bar */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-signal-cyan/20 border border-signal-cyan/40 text-signal-cyan text-xs font-mono font-bold flex items-center justify-center">
                    {step}
                  </span>
                  <span className="text-xs font-mono text-text-primary font-semibold tracking-wide uppercase">
                    {step === 1 ? 'Depot & Capacity Setup' : 'Roster Input & Objectives'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-10 bg-signal-cyan shadow-glow-cyan' : 'w-3 bg-white/20'}`} />
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-10 bg-signal-cyan shadow-glow-cyan' : 'w-3 bg-white/20'}`} />
                </div>
              </div>

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* Location Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-signal-cyan" /> Central Depot Location (Plus Code / Lat, Long)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        {...register('locationInput')}
                        placeholder="e.g. 7JVM+W4 or 20.9320, 77.7523"
                        className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-signal-cyan focus:ring-1 focus:ring-signal-cyan transition-all"
                      />
                      <MapPin className="w-4 h-4 text-text-muted/40 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.locationInput && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.locationInput.message}
                      </p>
                    )}
                  </div>

                  {/* Fleet Size Count */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5 text-bus-yellow" /> Total Active Fleet Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      {...register('fleetSizeCount', { onChange: handleFleetCountChange })}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-bus-yellow focus:ring-1 focus:ring-bus-yellow transition-all"
                    />
                    {errors.fleetSizeCount && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.fleetSizeCount.message}
                      </p>
                    )}
                  </div>

                  {/* Bus Capacities List */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-mono text-text-muted uppercase tracking-widest">
                        Individual Bus Capacity Customization
                      </label>
                      <span className="text-[10px] font-mono text-signal-cyan bg-signal-cyan/10 px-2 py-0.5 rounded-full border border-signal-cyan/20">
                        {busFields.length} Bus Units
                      </span>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {busFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/10 items-center hover:border-white/20 transition-colors">
                          <div className="col-span-7">
                            <input
                              type="text"
                              {...register(`buses.${index}.label` as const)}
                              placeholder="Bus Name / ID"
                              className="w-full px-3 py-1.5 rounded-lg bg-bg-panel border border-white/10 text-xs text-text-primary focus:outline-none focus:border-route-blue"
                            />
                          </div>
                          <div className="col-span-5 flex items-center gap-1.5">
                            <input
                              type="number"
                              {...register(`buses.${index}.capacity` as const)}
                              placeholder="Capacity"
                              className="w-full px-3 py-1.5 rounded-lg bg-bg-panel border border-white/10 text-xs text-text-primary focus:outline-none focus:border-route-blue"
                            />
                            <span className="text-[10px] font-mono text-text-muted uppercase">seats</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Step Button */}
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-route-blue via-blue-600 to-route-blue hover:from-blue-600 hover:to-route-blue text-white font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-glow-blue flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] mt-4"
                  >
                    Save & Continue
                    <ArrowRight className="w-4 h-4 text-signal-cyan" />
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  
                  {/* Data Source Selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-signal-cyan" /> Select Roster Input Method
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setValue('dataSourceType', 'preset')}
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          dataSourceType === 'preset'
                            ? 'bg-signal-cyan/10 border-signal-cyan text-signal-cyan ring-1 ring-signal-cyan shadow-glow-cyan/20'
                            : 'bg-white/[0.02] border-white/10 text-text-muted hover:bg-white/[0.04]'
                        }`}
                      >
                        <Sliders className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-text-primary">Preset Generator</p>
                          <p className="text-[10px] text-text-muted">Simulate student batch</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setValue('dataSourceType', 'csv')}
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          dataSourceType === 'csv'
                            ? 'bg-route-blue/10 border-route-blue text-route-blue ring-1 ring-route-blue shadow-glow-blue/20'
                            : 'bg-white/[0.02] border-white/10 text-text-muted hover:bg-white/[0.04]'
                        }`}
                      >
                        <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-text-primary">CSV / Excel Upload</p>
                          <p className="text-[10px] text-text-muted">Direct roster import</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Preset Batch Section */}
                  {dataSourceType === 'preset' && (
                    <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                          Random Student Batch Size
                        </label>
                        <select
                          {...register('presetStudentCount')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-bg-panel border border-white/10 text-xs text-text-primary focus:outline-none focus:border-signal-cyan"
                        >
                          <option value={50}>50 Students (Small District Test)</option>
                          <option value={75}>75 Students (Standard Batch)</option>
                          <option value={100}>100 Students (Medium Density)</option>
                          <option value={150}>150+ Students (Heavy Cluster)</option>
                        </select>
                      </div>

                      {/* Specific Students Manual Add */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono text-text-muted uppercase">
                            Add Custom Student (Optional)
                          </label>
                          <button
                            type="button"
                            onClick={() => appendStudent({ name: '', plusCode: '' })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] font-mono text-signal-cyan border border-white/10"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>

                        {studentFields.map((field, idx) => (
                          <div key={field.id} className="flex gap-2 items-center">
                            <input
                              type="text"
                              {...register(`specificStudents.${idx}.name` as const)}
                              placeholder="Name"
                              className="w-1/2 px-2.5 py-1.5 rounded-lg bg-bg-panel border border-white/10 text-xs text-text-primary"
                            />
                            <input
                              type="text"
                              {...register(`specificStudents.${idx}.plusCode` as const)}
                              placeholder="Plus Code"
                              className="w-1/2 px-2.5 py-1.5 rounded-lg bg-bg-panel border border-white/10 text-xs text-text-primary"
                            />
                            <button
                              type="button"
                              onClick={() => removeStudent(idx)}
                              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CSV Upload Section */}
                  {dataSourceType === 'csv' && (
                    <div className="space-y-2 p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/20 text-center">
                      <FileSpreadsheet className="w-8 h-8 text-route-blue mx-auto" />
                      <p className="text-xs font-semibold text-text-primary">Upload Roster File</p>
                      <p className="text-[10px] text-text-muted">Columns required: <code className="text-signal-cyan">student_name</code>, <code className="text-signal-cyan">home_plus_code</code></p>
                      <input
                        type="file"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        {...register('uploadedFile')}
                        className="block w-full text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-mono file:bg-route-blue/20 file:text-route-blue hover:file:bg-route-blue/30 cursor-pointer pt-2"
                      />
                    </div>
                  )}

                  {/* Objective Optimization Goal Cards */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-bus-yellow" /> Optimization Objective
                    </label>

                    <div className="grid grid-cols-3 gap-2.5">
                      <label className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                        optimizationGoal === 'fuel' ? 'bg-bus-yellow/10 border-bus-yellow text-bus-yellow ring-1 ring-bus-yellow' : 'bg-white/[0.02] border-white/10 text-text-muted hover:bg-white/[0.04]'
                      }`}>
                        <input type="radio" value="fuel" {...register('optimizationGoal')} className="sr-only" />
                        <Fuel className="w-4 h-4" />
                        <span className="text-xs font-bold text-text-primary">Min Fuel</span>
                        <span className="text-[9px] opacity-75">Shortest Distance</span>
                      </label>

                      <label className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                        optimizationGoal === 'time' ? 'bg-signal-cyan/10 border-signal-cyan text-signal-cyan ring-1 ring-signal-cyan' : 'bg-white/[0.02] border-white/10 text-text-muted hover:bg-white/[0.04]'
                      }`}>
                        <input type="radio" value="time" {...register('optimizationGoal')} className="sr-only" />
                        <Zap className="w-4 h-4" />
                        <span className="text-xs font-bold text-text-primary">Min Time</span>
                        <span className="text-[9px] opacity-75">Fastest Bell Sync</span>
                      </label>

                      <label className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                        optimizationGoal === 'capacity' ? 'bg-route-blue/10 border-route-blue text-route-blue ring-1 ring-route-blue' : 'bg-white/[0.02] border-white/10 text-text-muted hover:bg-white/[0.04]'
                      }`}>
                        <input type="radio" value="capacity" {...register('optimizationGoal')} className="sr-only" />
                        <Gauge className="w-4 h-4" />
                        <span className="text-xs font-bold text-text-primary">Max Capacity</span>
                        <span className="text-[9px] opacity-75">Full Utilization</span>
                      </label>
                    </div>
                  </div>

                  {/* Submit Action Controls */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-text-primary transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-route-blue via-signal-cyan to-route-blue hover:opacity-95 text-bg-grid font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2 font-mono text-xs text-white">
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          COMPUTING OPTIMAL TRAJECTORIES...
                        </span>
                      ) : (
                        <>
                          Run Optimization Algorithm
                          <Send className="w-3.5 h-3.5 text-bg-grid" />
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
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DemoRequestFormData, DemoRequestSchema } from '@/lib/validation';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  User,
  Bus,
  MessageSquare,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DemoRequestFormData>({
    resolver: zodResolver(DemoRequestSchema),
    defaultValues: {
      fullName: '',
      schoolDistrict: '',
      email: '',
      fleetSize: '16-50 buses',
      message: '',
    },
  });

  const onSubmit = async (data: DemoRequestFormData) => {
    setIsSubmitting(true);
    // Simulate API request
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Demo Request Submitted:', data);
    setIsSubmitting(false);
    setIsSubmitted(true);
    reset();
  };

  return (
    <section id="demo" className="relative w-full bg-bg-grid py-28 px-4 sm:px-6 lg:px-8 border-t border-white/5 overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-route-blue/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-signal-cyan/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Informational Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-signal-cyan text-xs font-mono tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" /> District Demonstration
          </div>

          <h2 className="text-3xl sm:text-5xl font-heading font-bold text-text-primary tracking-tight">
            See RouteWise live on your actual district map.
          </h2>

          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            Send us a sample anonymized roster or district boundary. Our transportation engineers will generate a fully interactive 3D route optimization simulation showing projected mileage savings and bell sync efficiency.
          </p>

          <div className="space-y-4 pt-4 border-t border-white/10 text-xs font-mono text-text-muted">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-signal-cyan" />
              <span>FERPA & COPPA Compliant Data Handling</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-route-blue" />
              <span>Customized Multi-Tier Bell Simulation</span>
            </div>
            <div className="flex items-center gap-3">
              <Bus className="w-4 h-4 text-bus-yellow" />
              <span>Full Hardware & GPS Compatibility Audit</span>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7 p-8 sm:p-12 rounded-3xl bg-bg-panel/85 border border-white/10 backdrop-blur-2xl shadow-glass-panel">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-signal-cyan/15 text-signal-cyan border border-signal-cyan/30 flex items-center justify-center mx-auto shadow-glow-cyan">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-text-primary">
                Demo Request Received
              </h3>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                A Senior Transportation Architect has been assigned to your district and will reach out with a sandbox demonstration link within one business day.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-6 px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-text-primary transition-all"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-signal-cyan" /> Full Name
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    placeholder="e.g. Director Sarah Miller"
                    className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none transition-all ${
                      errors.fullName
                        ? 'border-red-500/80 focus:border-red-500'
                        : 'border-white/10 focus:border-signal-cyan focus:shadow-glow-cyan/20'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* School District */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-route-blue" /> School District Name
                  </label>
                  <input
                    type="text"
                    {...register('schoolDistrict')}
                    placeholder="e.g. Springfield Public Schools"
                    className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none transition-all ${
                      errors.schoolDistrict
                        ? 'border-red-500/80 focus:border-red-500'
                        : 'border-white/10 focus:border-route-blue focus:shadow-glow-blue/20'
                    }`}
                  />
                  {errors.schoolDistrict && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.schoolDistrict.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Official Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-signal-cyan" /> Official Email
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="smiller@springfield.k12.us"
                    className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none transition-all ${
                      errors.email
                        ? 'border-red-500/80 focus:border-red-500'
                        : 'border-white/10 focus:border-signal-cyan focus:shadow-glow-cyan/20'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Fleet Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-bus-yellow" /> Active Fleet Size
                  </label>
                  <select
                    {...register('fleetSize')}
                    className="w-full px-4 py-3 rounded-xl bg-bg-panel border border-white/10 text-sm text-text-primary focus:outline-none focus:border-route-blue transition-all"
                  >
                    <option value="1-15 buses">1 - 15 buses (Small District)</option>
                    <option value="16-50 buses">16 - 50 buses (Medium District)</option>
                    <option value="51-150 buses">51 - 150 buses (Large District)</option>
                    <option value="151-500 buses">151 - 500 buses (Metropolitan)</option>
                    <option value="500+ buses">500+ buses (Regional / State)</option>
                  </select>
                  {errors.fleetSize && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.fleetSize.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-text-muted" /> Routing Challenges & Objectives
                </label>
                <textarea
                  rows={4}
                  {...register('message')}
                  placeholder="Tell us about your current routing software, bell-schedule goals, driver shortages, or timeline..."
                  className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none transition-all resize-none ${
                    errors.message
                      ? 'border-red-500/80 focus:border-red-500'
                      : 'border-white/10 focus:border-route-blue'
                  }`}
                />
                {errors.message && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.message.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-route-blue to-blue-600 hover:from-blue-600 hover:to-route-blue text-white font-heading font-semibold text-sm transition-all shadow-glow-blue flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2 font-mono text-xs">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    GENERATING DISTRICT PROPOSAL...
                  </span>
                ) : (
                  <>
                    Request Interactive District Demo
                    <Send className="w-4 h-4 text-signal-cyan" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

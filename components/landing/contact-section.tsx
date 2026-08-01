"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/components/layout/language-provider";

export default function ContactSection() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      
      // Clear success banner after 5s
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <section id="contact" className="relative py-24 bg-background text-foreground overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">{t("contact_title_section")}</h2>
          <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-6">
            {t("contact_subtitle_section")}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-light">
            {t("contact_desc_section")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Info Details (4 columns) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-8 bg-card border border-border rounded-2xl space-y-6">
              <h4 className="text-lg font-bold uppercase tracking-tight text-foreground mb-2">{t("office_title")}</h4>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <MapPin className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("address_label")}</p>
                  <p className="text-sm font-light text-muted-foreground leading-relaxed">
                    100 Fleet Parkway, Suite 500<br />Tech City, TC 94025
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-t border-border pt-6">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Phone className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("phone_label")}</p>
                  <p className="text-sm font-light text-muted-foreground leading-relaxed">
                    Dispatcher: +1 (800) 555-TAXI<br />Corporate Desk: +1 (555) 019-2899
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-t border-border pt-6">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Mail className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("email_label")}</p>
                  <p className="text-sm font-light text-muted-foreground leading-relaxed">
                    dispatch@smartforcetaxi.com<br />corporate@smartforcetaxi.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields (8 columns) */}
          <div className="lg:col-span-8">
            <div className="p-8 sm:p-10 bg-card border border-border rounded-3xl backdrop-blur-sm">
              <h4 className="text-xl font-bold uppercase tracking-tight text-foreground mb-6">{t("inquiry_title")}</h4>
              
              {submitted ? (
                <div className="p-8 rounded-2xl bg-green-500/10 border border-green-500/20 text-center text-green-600 dark:text-green-400 space-y-3 flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <h5 className="text-lg font-bold uppercase tracking-tight">{t("inquiry_success_title")}</h5>
                  <p className="text-sm font-light leading-relaxed max-w-md">
                    {t("inquiry_success_desc")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest" htmlFor="contact-name">
                        {t("name_label")}
                      </label>
                      <Input
                        id="contact-name"
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        disabled={isSubmitting}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest" htmlFor="contact-email">
                        {t("email")}
                      </label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="john@company.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        disabled={isSubmitting}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest" htmlFor="contact-subject">
                      {t("subject_label")}
                    </label>
                    <Input
                      id="contact-subject"
                      type="text"
                      placeholder="Corporate Booking / Driver Partnership Enquiry"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      disabled={isSubmitting}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest" htmlFor="contact-message">
                      {t("message_label")}
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      placeholder={t("placeholder_message")}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      disabled={isSubmitting}
                      className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.name || !form.email || !form.message}
                    className="w-full sm:w-auto inline-flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold uppercase tracking-wider text-xs rounded-lg transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                        {t("btn_sending")}
                      </>
                    ) : (
                      <>
                        {t("btn_submit_inquiry")}
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

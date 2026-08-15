"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Lock, CreditCard, Calendar, Briefcase, ShieldAlert, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser } from "@/actions/register";
import Link from "next/link";
import { useTheme } from "@/components/layout/theme-provider";
import { useTranslation } from "@/components/layout/language-provider";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  licenseNumber: z.string().min(5, "License number is required"),
  licenseExpiry: z.string().min(1, "License expiry date is required"),
  experience: z.number().min(0, "Experience must be a positive number"),
  emergencyContact: z.string().min(10, "Emergency contact must be at least 10 digits"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { t } = useTranslation();

  const logoSrc = theme === "dark" ? "/logo.png" : "/logo1.png";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      licenseNumber: "",
      licenseExpiry: "",
      experience: 0,
      emergencyContact: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        licenseNumber: data.licenseNumber,
        licenseExpiry: data.licenseExpiry,
        experience: data.experience,
        emergencyContact: data.emergencyContact,
      });

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setSuccess(true);
        setIsLoading(false);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-zinc-100 via-white to-amber-50/30 px-4 py-12 dark:from-zinc-950 dark:via-zinc-900 dark:to-amber-950/10">
      <Card className="w-full max-w-lg border-border bg-card/60 backdrop-blur-md glow-primary">
        <CardHeader className="space-y-1.5 text-center">
          <div className="mx-auto flex h-12 w-auto items-center justify-center mb-2">
            <img 
              src={logoSrc} 
              alt="Smart Force Taxi Logo" 
              className="h-12 w-auto object-contain dark:brightness-110"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{t("register_driver")}</CardTitle>
          <CardDescription>
            {t("register_driver_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-6 text-center text-green-600 dark:text-green-400 space-y-2">
              <h3 className="text-lg font-semibold">Registration Successful!</h3>
              <p className="text-sm">Your profile has been created. Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10 focus-visible:ring-amber-500"
                      disabled={isLoading}
                      {...register("name")}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@company.com"
                      className="pl-10 focus-visible:ring-amber-500"
                      disabled={isLoading}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 focus-visible:ring-amber-500"
                      disabled={isLoading}
                      {...register("password")}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 focus-visible:ring-amber-500"
                      disabled={isLoading}
                      {...register("confirmPassword")}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* License Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="licenseNumber">
                    Driving License Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="licenseNumber"
                      type="text"
                      placeholder="DL-8927491"
                      className="pl-10 focus-visible:ring-amber-500"
                      disabled={isLoading}
                      {...register("licenseNumber")}
                    />
                  </div>
                  {errors.licenseNumber && (
                    <p className="text-xs text-red-500 font-medium">{errors.licenseNumber.message}</p>
                  )}
                </div>

                {/* License Expiry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="licenseExpiry">
                    License Expiry Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="licenseExpiry"
                      type="date"
                      className="pl-10 focus-visible:ring-amber-500"
                      disabled={isLoading}
                      {...register("licenseExpiry")}
                    />
                  </div>
                  {errors.licenseExpiry && (
                    <p className="text-xs text-red-500 font-medium">{errors.licenseExpiry.message}</p>
                  )}
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="experience">
                    Years of Driving Experience
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="experience"
                      type="number"
                      placeholder="3"
                      className="pl-10 focus-visible:ring-amber-500"
                      disabled={isLoading}
                      {...register("experience", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.experience && (
                    <p className="text-xs text-red-500 font-medium">{errors.experience.message}</p>
                  )}
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="emergencyContact">
                    Emergency Contact Number
                  </label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="emergencyContact"
                      type="tel"
                      placeholder="+1 (555) 901-2948"
                      className="pl-10 focus-visible:ring-amber-500"
                      disabled={isLoading}
                      {...register("emergencyContact")}
                    />
                  </div>
                  {errors.emergencyContact && (
                    <p className="text-xs text-red-500 font-medium">{errors.emergencyContact.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("register_driver")}...
                  </>
                ) : (
                  t("register_button")
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-500 transition-colors">
                {t("already_account")}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

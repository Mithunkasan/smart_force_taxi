"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Truck, Mail, Lock, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/layout/theme-provider";
import { useTranslation } from "@/components/layout/language-provider";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { t } = useTranslation();

  const logoSrc = theme === "dark" ? "/logo.png" : "/logo1.png";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error && !result?.ok) {
        setError("Invalid email or password");
        setIsLoading(false);
      } else {
        router.refresh();
        router.push("/");
      }
    } catch (err) {
      console.error("Login unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-zinc-100 via-white to-amber-50/30 px-4 dark:from-zinc-950 dark:via-zinc-900 dark:to-amber-950/10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Smart Force Taxi",
            "url": "http://localhost:3000",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "All",
            "description": "Enterprise-grade Fleet Management System for vehicle tracking, driver scheduling, and maintenance logging.",
            "provider": {
              "@type": "Organization",
              "name": "Smart Force Taxi"
            }
          })
        }}
      />
      <Card className="w-full max-w-md border-border glass glow-primary relative">
        <button
          onClick={() => router.push("/")}
          className="absolute top-4 left-4 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title="Back to Home"
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-auto items-center justify-center mb-2">
            <img 
              src={logoSrc} 
              alt="Smart Force Taxi Logo" 
              className="h-12 w-auto object-contain dark:brightness-110"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{t("welcome_login")}</CardTitle>
          <CardDescription>
            {t("enter_credentials")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10"
                  disabled={isLoading}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={isLoading}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("sign_in")}...
                </>
              ) : (
                t("sign_in")
              )}
            </Button>
          </form>

          {/* <div className="mt-4 text-center text-xs">
            <span className="text-muted-foreground">{t("dont_have_account")} </span>
            <a href="/register" className="text-primary font-semibold hover:underline">
              {t("register_now")}
            </a>
          </div>   */}

          {/* Quick Access Info for Testing */}
          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-[11px] text-muted-foreground">Admin Credentials:</p>
            <div className="mt-2 text-[10px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40">
              <div>
                <span className="font-semibold block text-foreground">Admin Portal</span>
                admin@mattengg.com<br />Matt@4321admin
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

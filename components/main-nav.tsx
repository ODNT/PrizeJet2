"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { supabase } from "@/lib/supabase";

export function MainNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const { data } = await supabase.auth.getUser();
        setIsLoggedIn(!!data.user);
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthStatus();
  }, []);

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">
            PrizeJet
          </Link>
          {isLoggedIn && (
            <nav className="hidden md:flex gap-6">
              <Link
                href="/campaigns"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/campaigns" || pathname.startsWith("/campaigns/")
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Campaigns
              </Link>
              <Link
                href="/analytics"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/analytics"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Analytics
              </Link>
              <Link
                href="/settings"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/settings"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Settings
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {!isLoading && (
            <>
              {isLoggedIn ? (
                <Button variant="outline" onClick={async () => {
                  await supabase.auth.signOut();
                  setIsLoggedIn(false);
                  window.location.href = "/";
                }}>
                  Sign Out
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

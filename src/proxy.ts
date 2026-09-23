import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage } from "./i18n/locale";

export async function proxy(request: NextRequest) {
  // API-ruter gjør egen auth; ikke redirect dem til /login
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Språk-cookie: DB (innlogget bruker) > eksisterende cookie > Accept-Language.
  // Ren lesing her – selve førstegangs-skrivingen til profiles.language gjøres av
  // LocaleSync.tsx. Se docs/DECISIONS.md "Flerspråklighet".
  let localeToSet: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("language").eq("id", user.id).single();
    if (isLocale(profile?.language) && profile.language !== request.cookies.get(LOCALE_COOKIE)?.value) {
      localeToSet = profile.language;
    }
  } else if (!request.cookies.get(LOCALE_COOKIE)?.value) {
    localeToSet = localeFromAcceptLanguage(request.headers.get("accept-language"));
  }

  const pathname = request.nextUrl.pathname;
  const isPublic = ["/login", "/register", "/glemt-passord", "/nytt-passord", "/", "/om", "/support", "/privacy", "/auth"].some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  ) || pathname === "/manifest.webmanifest" || pathname === "/OneSignalSDKWorker.js" || pathname === "/OneSignalSDKUpdaterWorker.js" || pathname.startsWith("/icons/");

  const isCapacitor = request.cookies.get("capacitor")?.value === "1";

  if (!user && !isPublic && !isCapacitor) {
    return withLocaleCookie(NextResponse.redirect(new URL("/login", request.url)), localeToSet);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    return withLocaleCookie(NextResponse.redirect(new URL("/dashboard", request.url)), localeToSet);
  }

  return withLocaleCookie(supabaseResponse, localeToSet);
}

function withLocaleCookie(response: NextResponse, locale: string | null) {
  if (locale) response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.jpg|.*\\.jpeg|.*\\.png|.*\\.svg|.*\\.webp|login|register|public).*)",
  ],
};

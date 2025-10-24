import { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type React from "react";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = useState(false);

  // Ensure the component is mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

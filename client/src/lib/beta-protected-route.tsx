import { useAuth } from "@/hooks/use-auth";
import { useBeta } from "@/hooks/use-beta";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useLocation } from "wouter";
import { JSX, ComponentType } from "react";

type ComponentWithProps = ComponentType<any>;

export function BetaProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: ComponentWithProps;
}) {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { isBetaActive, isLoading: isLoadingBeta } = useBeta();
  const [location] = useLocation();

  // List of paths that are always allowed
  const allowedPaths = ["/landing", "/how-it-works", "/partner", "/scroll-landing", "/wave-demo"];
  const isAllowedPath = allowedPaths.includes(path);
  const isApiPath = path.startsWith("/api");

  // Show loading state while checking auth and beta status
  if (isLoadingAuth || isLoadingBeta) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        )}
      </Route>
    );
  }

  // Beta access check has been removed - all routes are allowed
  // Keep this commented out for future reference:
  // if (isBetaActive && !isAllowedPath && !isApiPath && !user) {
  //   return (
  //     <Route path={path}>
  //       {() => <Redirect to="/landing" />}
  //     </Route>
  //   );
  // }

  // Otherwise, render the component
  return <Route path={path} component={Component} />;
}
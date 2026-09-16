import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

import LandingPage from '@/pages/landing';
import LibraryPage from '@/pages/library';
import ResourceDetailPage from '@/pages/resource-detail';
import DashboardPage from '@/pages/dashboard';
import UnlockPage from '@/pages/unlock';
import SupportPage from '@/pages/support';

import AdminOverviewPage from '@/pages/admin/overview';
import AdminResourcesPage from '@/pages/admin/resources';
import AdminResourceEditorPage from '@/pages/admin/resource-editor';
import AdminUsersPage from '@/pages/admin/users';
import AdminSupportPage from '@/pages/admin/support';
import AdminSettingsPage from '@/pages/admin/settings';
import AdminImpactPage from '@/pages/admin/impact';
import AdminTaxonomiesPage from '@/pages/admin/taxonomies';
import { useGetMember, getGetMemberQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/navbar";
import SignUpDetailsPage from "@/pages/sign-up";
import SignUpAuthPage from "@/pages/sign-up-auth";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`, // Assuming logo.svg exists, wait, we don't have one, but it's required. Let's create a placeholder or just use a generic path
  },
  variables: {
    colorPrimary: "hsl(160, 84%, 25%)",
    colorForeground: "hsl(210, 11%, 15%)",
    colorMutedForeground: "hsl(210, 5%, 45%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(40, 15%, 85%)",
    colorInputForeground: "hsl(210, 11%, 15%)",
    colorNeutral: "hsl(40, 15%, 85%)",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-sm border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-2xl font-medium text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "font-medium",
    formFieldLabel: "text-sm font-medium",
    footerActionLink: "font-medium text-primary hover:text-primary/80",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-primary",
    alertText: "text-sm",
    logoBox: "mb-6",
    logoImage: "h-8",
    socialButtonsBlockButton: "border-border hover:bg-secondary",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
    formFieldInput: "border-input bg-white rounded-md",
    footerAction: "mt-4",
    dividerLine: "bg-border",
    alert: "border-destructive text-destructive",
    otpCodeFieldInput: "border-input rounded-md",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/dashboard`} />
    </div>
  );
}

function SignUpPage() {
  return <SignUpDetailsPage />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { isSignedIn, isLoaded: clerkLoaded } = useUser();
  const { data: member, isLoading: memberLoading } = useGetMember({
    query: { enabled: !!isSignedIn, queryKey: getGetMemberQueryKey() }
  });

  if (!clerkLoaded) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!isSignedIn) return <Redirect to="/sign-in" />;

  if (adminOnly) {
    if (memberLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    if (member?.role !== 'admin') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
          <h2 className="text-2xl font-serif mb-2">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">
            You do not have permission to view the admin area. See the project README for instructions on securely configuring the first admin user.
          </p>
        </div>
      );
    }
  }

  return <Component {...rest} />;
}


function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>
    </div>
  );
}


function AppRoutes() {
  return (
    <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/library" component={LibraryPage} />
        <Route path="/resources/:slug" component={ResourceDetailPage} />
        
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/auth/*?" component={SignUpAuthPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        
        <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
        <Route path="/unlock"><ProtectedRoute component={UnlockPage} /></Route>
        <Route path="/support"><ProtectedRoute component={SupportPage} /></Route>

        <Route path="/admin"><ProtectedRoute adminOnly component={AdminOverviewPage} /></Route>
        <Route path="/admin/resources"><ProtectedRoute adminOnly component={AdminResourcesPage} /></Route>
        <Route path="/admin/resources/new"><ProtectedRoute adminOnly component={AdminResourceEditorPage} /></Route>
        <Route path="/admin/resources/:id"><ProtectedRoute adminOnly component={AdminResourceEditorPage} /></Route>
        <Route path="/admin/users"><ProtectedRoute adminOnly component={AdminUsersPage} /></Route>
        <Route path="/admin/support"><ProtectedRoute adminOnly component={AdminSupportPage} /></Route>
        <Route path="/admin/settings"><ProtectedRoute adminOnly component={AdminSettingsPage} /></Route>
        <Route path="/admin/impact"><ProtectedRoute adminOnly component={AdminImpactPage} /></Route>
        <Route path="/admin/taxonomies"><ProtectedRoute adminOnly component={AdminTaxonomiesPage} /></Route>

        <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const [location] = useLocation();
  const routes = <AppRoutes />;
  return location.startsWith("/sign-in") || location.startsWith("/sign-up")
    ? routes
    : <Layout>{routes}</Layout>;
}
function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <RoutedErrorBoundary>
          <Router />
        </RoutedErrorBoundary>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;

import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser, useClerk } from "@clerk/react";
import { useGetMember, getGetMemberQueryKey, useGetSite } from "@workspace/api-client-react";
import { LogOut, LayoutDashboard, Settings, Library, Lock, User, LifeBuoy, Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();

  const { data: member } = useGetMember({
    query: { enabled: !!isSignedIn, queryKey: getGetMemberQueryKey() }
  });
  
  const { data: site } = useGetSite();

  const isAdmin = member?.role === 'admin';

  return (
    <>
      {site?.development && (
        <div className="w-full bg-amber-100 text-amber-900 border-b border-amber-200 text-xs font-medium py-2 px-4 text-center">
          Development preview — demo resources are not published
        </div>
      )}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-6">
            {/* Mobile menu */}
            <div className="md:hidden flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="-ml-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem asChild><Link href="/library" className="cursor-pointer">Library</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/support" className="cursor-pointer">Support</Link></DropdownMenuItem>
                  {!isSignedIn && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild><Link href="/sign-in" className="cursor-pointer">Sign In</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/unlock" className="cursor-pointer text-primary font-medium">Unlock Vault</Link></DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link href="/" className="font-serif text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            {site?.logoUrl ? (
              <img src={site.logoUrl} alt={site.brandName || "EcomStack"} className="h-8 w-auto object-contain" />
            ) : (
              <span className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs leading-none">
                {(site?.brandName || "EcomStack").charAt(0)}
              </span>
            )}
            {!site?.logoUrl && (site?.brandName || "EcomStack")}
          </Link>
          
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link 
              href="/library" 
              className={`transition-colors hover:text-primary ${location === '/library' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Library
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {!isSignedIn ? (
            <>
              <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors hidden md:inline-block">
                Sign In
              </Link>
              <Button asChild className="rounded-full px-6 hidden sm:inline-flex">
                <Link href="/unlock">Unlock Vault</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                    <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/library" className="cursor-pointer flex items-center">
                    <Library className="mr-2 h-4 w-4" />
                    <span>Resource Library</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/support" className="cursor-pointer flex items-center">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </Link>
                </DropdownMenuItem>

                {!member?.hasAccess && (
                  <DropdownMenuItem asChild>
                    <Link href="/unlock" className="cursor-pointer flex items-center text-primary focus:text-primary">
                      <Lock className="mr-2 h-4 w-4" />
                      <span>Unlock Access</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Overview</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      </header>
    </>
  );
}

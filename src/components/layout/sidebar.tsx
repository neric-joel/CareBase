'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardPlus,
  Search,
  Settings,
  Calendar,
  Shield,
  Heart,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  isAI?: boolean;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/service/new', label: 'Log Service', icon: ClipboardPlus },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/search', label: 'AI Search', icon: Search, isAI: true },
  { href: '/admin', label: 'Admin', icon: Settings, adminOnly: true },
  { href: '/audit', label: 'Audit Log', icon: Shield, adminOnly: true },
];

function NavContent({ onClose, userRole }: { onClose?: () => void; userRole: string | null }) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === 'admin'
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <Heart className="h-6 w-6 text-primary" aria-hidden="true" />
        <span className="text-lg font-semibold text-primary">CareBase</span>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
              {item.isAI && (
                <Badge className="ml-auto bg-accent text-accent-foreground text-xs px-1.5 py-0">
                  AI
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {userRole && (
        <div className="px-4 py-3 border-t text-xs text-muted-foreground">
          Role: <span className="font-medium capitalize">{userRole}</span>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data?.role) {
        setUserRole(data.role);
      } else {
        // Fallback: read role from auth user_metadata (set during signup/seed)
        const metaRole = user.user_metadata?.role;
        if (metaRole === 'admin' || metaRole === 'staff') {
          setUserRole(metaRole);
        }
      }
    }
    fetchRole();
  }, []);

  return (
    <>
      {/* Mobile hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-40 md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r bg-card shadow-lg transition-transform duration-200 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar navigation"
      >
        <NavContent onClose={() => setIsOpen(false)} userRole={userRole} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-card"
        aria-label="Sidebar navigation"
      >
        <NavContent userRole={userRole} />
      </aside>
    </>
  );
}

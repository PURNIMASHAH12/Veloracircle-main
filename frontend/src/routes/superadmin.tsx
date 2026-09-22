import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users,
  LogOut,
} from "lucide-react";
import { useState } from "react";

import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { VeloraLogo } from "@/components/velora/logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin")({
  component: SuperadminPage,
});

const admins = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    status: "Active",
    lastActivity: "Today",
  },
];

function SuperadminPage() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate({
      to: "/",
    });
  };

  return (
    <div className="bg-background flex h-dvh w-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-sidebar-border hidden shrink-0 border-r transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex h-full flex-col">
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b border-border/60 px-4",
              collapsed && "justify-center px-2",
            )}
          >
            <VeloraLogo compact={collapsed} />
          </div>

          <div className="flex-1 px-3 py-4">
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary",
                collapsed && "justify-center px-2",
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />

              {!collapsed && (
                <span>Admin Monitoring</span>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-border/60 p-3">
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />

              {!collapsed && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/80 grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 border-b px-3 py-2.5 backdrop-blur-xl sm:px-5">
          <button
            type="button"
            onClick={() =>
              setCollapsed((value) => !value)
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          <div>
            <p className="text-sm font-semibold">
              Superadmin
            </p>

            <p className="text-xs text-muted-foreground">
              Admin monitoring
            </p>
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* Heading */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Admin Monitoring
                </h1>

                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>

              <p className="text-muted-foreground mt-1.5 text-sm">
                Monitor administrator accounts and activity.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="surface-panel rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Admins
                    </p>

                    <p className="text-2xl font-bold">
                      {admins.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="surface-panel rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Active Admins
                    </p>

                    <p className="text-2xl font-bold">
                      {
                        admins.filter(
                          (admin) =>
                            admin.status === "Active",
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin table */}
            <section>
              <h2 className="mb-4 text-lg font-semibold">
                Administrators
              </h2>

              <div className="surface-panel overflow-x-auto rounded-2xl">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-border border-b text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 font-medium">
                        Admin
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Email
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Status
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Last Activity
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {admins.map((admin) => (
                      <tr
                        key={admin.id}
                        className="border-border border-b last:border-b-0"
                      >
                        <td className="px-4 py-4 font-medium">
                          {admin.name}
                        </td>

                        <td className="text-muted-foreground px-4 py-4">
                          {admin.email}
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {admin.status}
                          </span>
                        </td>

                        <td className="text-muted-foreground px-4 py-4">
                          {admin.lastActivity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
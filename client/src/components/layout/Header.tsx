import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Menu, BarChart3, Ticket, Calendar, LogOut, User, Settings, Clock, Folder, UserCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleTimer } from "@/contexts/SimpleTimerContext";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const { runningAction, finishAction } = useSimpleTimer();
  const [, setLocation] = useLocation();

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <Button
        variant="ghost"
        className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </Button>
          </Link>
          <Link href="/tickets">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <Ticket className="h-5 w-5" />
              <span className="font-medium">Tickets</span>
            </Button>
          </Link>
          <Link href="/agenda-manager">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Agenda</span>
            </Button>
          </Link>
          <Link href="/projects">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <Folder className="h-5 w-5" />
              <span className="font-medium">Projetos</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Timer Icon - Only visible when there's a running action */}
          {runningAction && (
            <Button
              variant="ghost"
              size="sm"
              className="relative text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 animate-pulse"
              onClick={async () => {
                console.log('🔴 [HEADER] Timer icon clicked, finishing action:', runningAction.actionId);
                try {
                  // Finalizar a ação preenchendo hora fim
                  await finishAction(runningAction.actionId);
                  
                  // Navegar para o ticket e abrir a ação editada
                  setLocation(`/tickets/${runningAction.ticketId}?openAction=${runningAction.actionId}`);
                } catch (error) {
                  console.error('❌ [HEADER] Error finishing action:', error);
                }
              }}
              title="Cronômetro ativo - Clique para finalizar"
            >
              <Clock className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800 animate-ping"></span>
            </Button>
          )}
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800"></span>
          </Button>

          {/* User Profile Dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`relative h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700 ${
                    runningAction 
                      ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 shadow-lg shadow-yellow-400/50' 
                      : ''
                  }`}
                >
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                  </span>
                  {/* Aura amarela pulsante quando trabalhando */}
                  {runningAction && (
                    <span className="absolute inset-0 rounded-full ring-2 ring-yellow-400 animate-pulse"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/timecard" className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Registro de Ponto</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
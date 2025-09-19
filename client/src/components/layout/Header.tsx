import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Menu, BarChart3, Ticket, Calendar, LogOut, User, Settings, Clock, Folder, UserCircle, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LanguageSelector } from '@/components/LanguageSelector';

export function Header() {
  const { t } = useTranslation();

  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  // ✅ 1QA.MD: Query para obter dados completos do perfil com avatar atualizado
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/profile');
      const data = await response.json();
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos para permitir atualizações
    refetchOnWindowFocus: false,
  });

  // Query para verificar status do timecard
  const { data: timecardStatus } = useQuery({
    queryKey: ['/api/timecard/current-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/timecard/current-status');
      const data = await response.json();
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Query para buscar notificações não lidas
  const { data: notificationsData } = useQuery({
    queryKey: ['/api/schedule-notifications/count'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/schedule-notifications/count');
      const data = await response.json();
      return data;
    },
    enabled: !!user,
    refetchInterval: 60000, // Atualizar a cada 60 segundos
  });

  // Determinar se usuário está trabalhando
  const isWorking = timecardStatus?.status === 'working';
  
  // Obter número de notificações não lidas
  const unreadCount = notificationsData?.success ? notificationsData.data?.unreadCount || 0 : 0;

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
              <span className="font-medium">{t('navigation.dashboard')}</span>
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
          <Link href="/interactive-map">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <MapPin className="h-5 w-5" />
              <span className="font-medium">Mapa</span>
            </Button>
          </Link>
          {/* Removed: Projects link - module completely eliminated */}
        </div>

        <div className="flex items-center space-x-4">
          {/* Timecard Working Status - Only visible when user is working */}
          {isWorking && (
            <Button
              variant="ghost"
              size="sm"
              className="relative text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
              onClick={() => setLocation('/timecard')}
              title="Ponto registrado - Você está trabalhando"
            >
              <Clock className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800 animate-pulse"></span>
            </Button>
          )}

          {/* Notifications */}
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="sm"
              className="relative text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
              title={`${unreadCount} notificações não lidas`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800"></span>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold min-w-[20px]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </>
              )}
            </Button>
          </Link>

          {/* User Profile Dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`relative h-8 w-8 rounded-full p-0 ${
                    isWorking 
                      ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 shadow-lg shadow-yellow-400/50' 
                      : ''
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={userProfile?.avatar || userProfile?.avatar_url || ""} 
                      alt={`${userProfile?.firstName || user?.firstName} ${userProfile?.lastName || user?.lastName}`}
                    />
                    <AvatarFallback className="bg-purple-600 text-white text-sm font-semibold">
                      {(userProfile?.firstName || user?.firstName) ? 
                        (userProfile?.firstName || user?.firstName).charAt(0).toUpperCase() : 
                        user?.email?.charAt(0).toUpperCase()
                      }
                    </AvatarFallback>
                  </Avatar>
                  {/* Aura amarela pulsante quando trabalhando */}
                  {isWorking && (
                    <span className="absolute inset-0 rounded-full ring-2 ring-yellow-400 animate-pulse"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {(userProfile?.firstName || user?.firstName) ? 
                        `${userProfile?.firstName || user?.firstName} ${userProfile?.lastName || user?.lastName || ''}`.trim() : 
                        userProfile?.email || user?.email
                      }
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email || user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {userProfile?.role || user?.role}
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
                    <span>{userProfile?.employmentType === 'autonomo' ? 'Registro de Trabalho' : 'Registro de Ponto'}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Idioma</div>
                  <LanguageSelector variant="compact" showFlag={true} />
                </div>
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
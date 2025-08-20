import { Button } from {"User Profile"}@/components/ui/button{"User Profile"};
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from {"User Profile"}@/components/ui/dropdown-menu{"User Profile"};
import { Avatar, AvatarFallback, AvatarImage } from {"User Profile"}@/components/ui/avatar{"User Profile"};
import { Bell, Menu, BarChart3, Ticket, Calendar, LogOut, User, Settings, Clock, Folder, UserCircle } from {"User Profile"}lucide-react{"User Profile"};
import { Link, useLocation } from {"User Profile"}wouter{"User Profile"};
import { useAuth } from {"User Profile"}@/hooks/useAuth{"User Profile"};
import { useQuery } from {"User Profile"}@tanstack/react-query{"User Profile"};
import { apiRequest } from {"User Profile"}@/lib/queryClient{"User Profile"};
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
  // Determinar se usuário está trabalhando
  const isWorking = timecardStatus?.status === 'working';
  return (
    <div className={"User Profile"}relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700{"User Profile"}>
      <Button
        variant={"User Profile"}ghost{"User Profile"
        className={"User Profile"}px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 lg:hidden{"User Profile"
      >
        <Menu className={"User Profile"}h-5 w-5{"User Profile"} />
      </Button>
      <div className={"User Profile"}flex-1 px-4 flex justify-between items-center{"User Profile"}>
        <div className={"User Profile"}flex items-center space-x-4{"User Profile"}>
          <Link href={"User Profile"}/{"User Profile"}>
            <Button
              variant={"User Profile"}ghost{"User Profile"
              className={"User Profile"}flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400{"User Profile"
            >
              <BarChart3 className={"User Profile"}h-5 w-5{"User Profile"} />
              <span className={"User Profile"}font-medium{"User Profile"}>'[TRANSLATION_NEEDED]'</span>
            </Button>
          </Link>
          <Link href={"User Profile"}/tickets{"User Profile"}>
            <Button
              variant={"User Profile"}ghost{"User Profile"
              className={"User Profile"}flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400{"User Profile"
            >
              <Ticket className={"User Profile"}h-5 w-5{"User Profile"} />
              <span className={"User Profile"}font-medium{"User Profile"}>Tickets</span>
            </Button>
          </Link>
          <Link href={"User Profile"}/agenda-manager{"User Profile"}>
            <Button
              variant={"User Profile"}ghost{"User Profile"
              className={"User Profile"}flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400{"User Profile"
            >
              <Calendar className={"User Profile"}h-5 w-5{"User Profile"} />
              <span className={"User Profile"}font-medium{"User Profile"}>Agenda</span>
            </Button>
          </Link>
          {/* Removed: Projects link - module completely eliminated */}
        </div>
        <div className={"User Profile"}flex items-center space-x-4{"User Profile"}>
          {/* Timecard Working Status - Only visible when user is working */}
          {isWorking && (
            <Button
              variant={"User Profile"}ghost{"User Profile"
              size={"User Profile"}sm{"User Profile"
              className={"User Profile"}relative text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300{"User Profile"
              onClick={() => setLocation('/timecard')}
              title={"User Profile"}Ponto registrado - Você está trabalhando{"User Profile"
            >
              <Clock className={"User Profile"}h-5 w-5{"User Profile"} />
              <span className={"User Profile"}absolute top-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800 animate-pulse{"User Profile"}></span>
            </Button>
          )}
          {/* Notifications */}
          <Button
            variant={"User Profile"}ghost{"User Profile"
            size={"User Profile"}sm{"User Profile"
            className={"User Profile"}relative text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200{"User Profile"
          >
            <Bell className={"User Profile"}h-5 w-5{"User Profile"} />
            <span className={"User Profile"}absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800{"User Profile"}></span>
          </Button>
          {/* User Profile Dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"User Profile"}ghost{"User Profile"
                  className={`relative h-8 w-8 rounded-full p-0 ${
                    isWorking 
                      ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 shadow-lg shadow-yellow-400/50' 
                      : ''
                  {"User Profile"
                >
                  <Avatar className={"User Profile"}h-8 w-8{"User Profile"}>
                    <AvatarImage 
                      src={userProfile?.avatar || userProfile?.avatar_url || {"User Profile"}{"User Profile"}} 
                      alt={{"User Profile"
                    />
                    <AvatarFallback className={"User Profile"}bg-purple-600 text-white text-sm font-semibold{"User Profile"}>
                      {(userProfile?.firstName || user?.firstName) ? 
                        (userProfile?.firstName || user?.firstName).charAt(0).toUpperCase() : 
                        user?.email?.charAt(0).toUpperCase()
                      }
                    </AvatarFallback>
                  </Avatar>
                  {/* Aura amarela pulsante quando trabalhando */}
                  {isWorking && (
                    <span className={"User Profile"}absolute inset-0 rounded-full ring-2 ring-yellow-400 animate-pulse{"User Profile"}></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className={"User Profile"}w-56{"User Profile"} align={"User Profile"}end{"User Profile"} forceMount>
                <DropdownMenuLabel className={"User Profile"}font-normal{"User Profile"}>
                  <div className={"User Profile"}flex flex-col space-y-1{"User Profile"}>
                    <p className={"User Profile"}text-sm font-medium leading-none{"User Profile"}>
                      {(userProfile?.firstName || user?.firstName) ? 
                        {"User Profile"
                        userProfile?.email || user?.email
                      }
                    </p>
                    <p className={"User Profile"}text-xs leading-none text-muted-foreground{"User Profile"}>
                      {userProfile?.email || user?.email}
                    </p>
                    <p className={"User Profile"}text-xs leading-none text-muted-foreground capitalize{"User Profile"}>
                      {userProfile?.role || user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={"User Profile"}/profile{"User Profile"} className={"User Profile"}flex items-center{"User Profile"}>
                    <UserCircle className={"User Profile"}mr-2 h-4 w-4{"User Profile"} />
                    <span>Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={"User Profile"}/timecard{"User Profile"} className={"User Profile"}flex items-center{"User Profile"}>
                    <Clock className={"User Profile"}mr-2 h-4 w-4{"User Profile"} />
                    <span>Registro de Ponto</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className={"User Profile"}px-2 py-1.5{"User Profile"}>
                  <div className={"User Profile"}text-xs font-medium text-muted-foreground mb-2{"User Profile"}>Idioma</div>
                  <LanguageSelector variant={"User Profile"}compact{"User Profile"} showFlag={true} />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={"User Profile"}text-red-600 cursor-pointer{"User Profile"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className={"User Profile"}mr-2 h-4 w-4{"User Profile"} />
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
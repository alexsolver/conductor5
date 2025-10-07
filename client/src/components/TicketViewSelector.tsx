import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Settings, Plus, Eye, Users, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TicketViewSelectorProps {
  currentViewId?: string;
  onViewChange: (viewId: string) => void;
}

export function TicketViewSelector({ currentViewId, onViewChange }: TicketViewSelectorProps) {
  const { t } = useTranslation();
  const [isNewViewModalOpen, setIsNewViewModalOpen] = useState(false);
  const [isManageViewsOpen, setIsManageViewsOpen] = useState(false);

  // Fetch ALL ticket views for dropdown (includes system default)
  const { data: viewsData, isLoading } = useQuery({
    queryKey: ["/api/ticket-views"],
    retry: false,
  });

  // Fetch MANAGEABLE ticket views for settings tab (excludes system default)
  const { data: manageableViewsData } = useQuery({
    queryKey: ["/api/ticket-views", { manageable: true }],
    queryFn: async () => {
      const response = await fetch("/api/ticket-views?manageable=true", {
        credentials: "include",
        headers: {
          "x-tenant-id": localStorage.getItem("tenantId") || "",
        },
      });
      return response.json();
    },
    enabled: isManageViewsOpen, // Only fetch when dialog is open
    retry: false,
  });

  const ticketViews = (viewsData as any)?.data || [];
  const manageableViews = (manageableViewsData as any)?.data || [];

  // Find current view
  const currentView = ticketViews.find((view: any) => view.id === currentViewId) || 
                     ticketViews.find((view: any) => view.is_default) ||
                     { id: 'default', name: t('tickets.views.defaultView') };

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
{t('tickets.views.view')}:
          </span>
        </div>

        <Select value={currentViewId || 'default'} onValueChange={onViewChange}>
          <SelectTrigger className="w-64">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{currentView.name}</span>
                {currentView.is_public && (
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {t('tickets.views.public')}
                  </Badge>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ticketViews.length === 0 ? (
              <SelectItem value="default" disabled>
{t('tickets.views.noViewsAvailable')}
              </SelectItem>
            ) : (
              ticketViews.map((view: any) => (
                <SelectItem key={view.id} value={view.id}>
                  <div className="flex items-center gap-2">
                    <span>{view.name}</span>
                    {view.is_public && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {t('tickets.views.public')}
                      </Badge>
                    )}
                    {view.is_default && (
                      <Badge variant="outline" className="text-xs">
{t('tickets.views.default')}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {currentView.description && (
          <span className="text-sm text-gray-500 italic">
            {currentView.description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Dialog open={isNewViewModalOpen} onOpenChange={setIsNewViewModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('tickets.views.newView')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('tickets.views.createNewView')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('tickets.views.viewName')}</label>
                <Input placeholder={t('tickets.views.descriptionPlaceholder')} />
              </div>
              <div>
                <label className="text-sm font-medium">{t('tickets.views.description')}</label>
                <Input placeholder={t('tickets.views.descriptionPlaceholder')} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewViewModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button>
                  {t('tickets.views.createNewView')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isManageViewsOpen} onOpenChange={setIsManageViewsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {t('tickets.views.manage')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('tickets.views.manageViews')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {manageableViews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('tickets.views.noViewsAvailable')}</p>
                  <p className="text-sm">Clique em "{t('tickets.views.newView')}" para criar sua primeira visualização.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {manageableViews.map((view: any) => (
                    <div key={view.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{view.name}</h3>
                          <div className="flex gap-2">
                            {view.is_public && (
                              <Badge variant="secondary">
                                <Users className="h-3 w-3 mr-1" />
                                {t('tickets.views.public')}
                              </Badge>
                            )}
                            {view.is_default && (
                              <Badge variant="outline">{t('tickets.views.default')}</Badge>
                            )}
                          </div>
                        </div>
                        {view.description && (
                          <p className="text-sm text-gray-500 mt-1">{view.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
{t('common.edit')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onViewChange(view.id)}>
{t('common.use')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
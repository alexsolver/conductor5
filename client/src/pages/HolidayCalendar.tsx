// HOLIDAY CALENDAR MANAGEMENT
// Sistema completo de gerenciamento de feriados multilocation
// Integrado ao sistema de controle de jornadas
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Filter, Download, Upload, MapPin, Globe, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
// import useLocalization from '@/hooks/useLocalization';
// Types
interface Holiday {
  id: string;
  tenantId: string;
  name: string;
  date: string;
  type: 'national' | 'regional' | 'corporate' | 'optional';
  countryCode: string;
  regionCode?: string;
  isRecurring: boolean;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
// Zod schema for form validation
const holidayFormSchema = z.object({
  // Localization temporarily disabled
  name: z.string().min(1, 'Nome do feriado é obrigatório'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  type: z.enum(['national', 'regional', 'corporate', 'optional'], {
    required_error: 'Tipo de feriado é obrigatório'
  }),
  countryCode: z.string().min(2, 'Código do país é obrigatório').max(3),
  regionCode: z.string().optional(),
  isRecurring: z.boolean().default(false),
  description: z.string().optional()
});
type HolidayFormData = z.infer<typeof holidayFormSchema>;
const typeLabels = {
  national: 'Nacional',
  regional: 'Regional',
  corporate: 'Corporativo',
  optional: 'Opcional'
};
const typeColors = {
  national: 'bg-red-100 text-red-800 border-red-200',
  regional: 'bg-blue-100 text-blue-800 border-blue-200',
  corporate: 'bg-green-100 text-green-800 border-green-200',
  optional: 'bg-yellow-100 text-yellow-800 border-yellow-200'
};
const typeIcons = {
  national: <Globe className="h-3 w-3" />,
  regional: <MapPin className="h-3 w-3" />,
  corporate: <Building className="h-3 w-3" />,
  optional: <Calendar className="h-3 w-3" />
};
export default function HolidayCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCountry, setSelectedCountry] = useState('BRA');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const form = useForm<HolidayFormData>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: '',
      date: '',
      type: 'national',
      countryCode: 'BRA',
      regionCode: '',
      isRecurring: false,
      description: ''
    }
  });
  // Query holidays
  const { data: holidaysData, isLoading } = useQuery({
    queryKey: ['/api/holidays', { year: selectedYear, countryCode: selectedCountry, type: selectedType, regionCode: selectedRegion }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      params.append('countryCode', selectedCountry);
      if (selectedType) params.append('type', selectedType);
      if (selectedRegion) params.append('regionCode', selectedRegion);
      params.append('limit', '100');
      
      const response = await fetch("
      if (!response.ok) throw new Error('Failed to fetch holidays');
      return response.json();
    }
  });
  // Create holiday mutation
  const createHolidayMutation = useMutation({
    mutationFn: async (data: HolidayFormData) => {
      return await apiRequest('POST', '/api/holidays', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/holidays'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: 'Feriado criado',
        description: 'O feriado foi criado com sucesso.'
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '[TRANSLATION_NEEDED]',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar o feriado.'
      });
    }
  });
  const onSubmit = (data: HolidayFormData) => {
    createHolidayMutation.mutate(data);
  };
  const holidays = holidaysData?.holidays || [];
  const totalHolidays = holidaysData?.total || 0;
  // Group holidays by month
  const holidaysByMonth = holidays.reduce((acc: Record<string, Holiday[]>, holiday: Holiday) => {
    const month = holiday.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return (
    <div className=""
      {/* Header */}
      <div className=""
        <div>
          <h1 className="text-lg">"Calendário de Feriados</h1>
          <p className="text-lg">"Gerenciar feriados para controle de jornadas multilocation</p>
        </div>
        
        <div className=""
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Feriado
              </Button>
            </DialogTrigger>
            <DialogContent className=""
              <DialogHeader>
                <DialogTitle>Criar Novo Feriado</DialogTitle>
                <DialogDescription>
                  Adicione um novo feriado ao calendário do sistema
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className=""
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Feriado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Natal, Independência..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className=""
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(typeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className=""
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BRA">Brasil</SelectItem>
                              <SelectItem value="USA">Estados Unidos</SelectItem>
                              <SelectItem value="FRA">França</SelectItem>
                              <SelectItem value="DEU">Alemanha</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="regionCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Região (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: SP, RJ, BA..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className=""
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className=""
                          <FormLabel>Feriado recorrente</FormLabel>
                          <p className=""
                            Se repete todo ano na mesma data
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição adicional sobre o feriado"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className=""
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createHolidayMutation.isPending}>
                      {createHolidayMutation.isPending ? 'Criando...' : '[TRANSLATION_NEEDED]'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className=""
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className=""
            <div className=""
              <label className="text-lg">"Ano</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className=""
              <label className="text-lg">"País</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRA">Brasil</SelectItem>
                  <SelectItem value="USA">Estados Unidos</SelectItem>
                  <SelectItem value="FRA">França</SelectItem>
                  <SelectItem value="DEU">Alemanha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className=""
              <label className="text-lg">"Tipo</label>
              <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className=""
              <label className="text-lg">"Região</label>
              <Input
                placeholder="Ex: SP, RJ..."
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Stats */}
      <div className=""
        <Card>
          <CardContent className=""
            <div className=""
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-lg">"Total de Feriados</p>
                <p className="text-lg">"{totalHolidays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className=""
            <div className=""
              <Globe className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-lg">"Nacionais</p>
                <p className=""
                  {holidays.filter((h: Holiday) => h.type === 'national').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className=""
            <div className=""
              <MapPin className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-lg">"Regionais</p>
                <p className=""
                  {holidays.filter((h: Holiday) => h.type === 'regional').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className=""
            <div className=""
              <Building className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-lg">"Corporativos</p>
                <p className=""
                  {holidays.filter((h: Holiday) => h.type === 'corporate').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Holidays List */}
      <Card>
        <CardHeader>
          <CardTitle>Feriados {selectedYear} - {selectedCountry}</CardTitle>
          <CardDescription>
            Lista de feriados organizados por mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-lg">"Carregando feriados...</div>
          ) : (
            <div className=""
              {monthNames.map((monthName, index) => {
                const monthKey = "
                const monthHolidays = holidaysByMonth[monthKey] || [];
                
                if (monthHolidays.length === 0) return null;
                
                return (
                  <div key={monthKey} className=""
                    <h3 className="text-lg">"{monthName}</h3>
                    <div className=""
                      {monthHolidays.map((holiday: Holiday) => (
                        <div key={holiday.id} className=""
                          <div className=""
                            <div className=""
                              <div className=""
                                {new Date(holiday.date + 'T00:00:00').getDate()}
                              </div>
                              <div className=""
                                {new Date(holiday.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-lg">"{holiday.name}</h4>
                              {holiday.description && (
                                <p className="text-lg">"{holiday.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className=""
                            {holiday.regionCode && (
                              <Badge variant="outline" className=""
                                {holiday.regionCode}
                              </Badge>
                            )}
                            
                            <Badge className="text-lg">"
                              <span className=""
                                {typeIcons[holiday.type]}
                                {typeLabels[holiday.type]}
                              </span>
                            </Badge>
                            
                            {holiday.isRecurring && (
                              <Badge variant="secondary" className=""
                                Recorrente
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(holidaysByMonth).length === 0 && (
                <div className=""
                  Nenhum feriado encontrado para os filtros selecionados.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
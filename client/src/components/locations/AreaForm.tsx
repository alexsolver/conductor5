import React, { useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Map, Palette, Plus, Upload, Trash2, MapPin, Target, Route, FileText, Download } from "lucide-react";
import { areaSchema, type NewArea } from "@/../../shared/schema-locations-new";
import { useToast } from "@/hooks/use-toast";
import LeafletMapSelector from "@/components/LeafletMapSelector";
// import { useLocalization } from '@/hooks/useLocalization';
interface AreaFormProps {
  onSubmit: (data: NewArea) => void;
  onCancel: () => void;
  isLoading?: boolean;
}
// Componente para seleção de cores predefinidas
const ColorPicker = ({
  // Localization temporarily disabled
 value, onChange }) => {
  const coresPredefinidas = [
    { cor: "#3B82F6", nome: "Azul" },
    { cor: "#EF4444", nome: "Vermelho" },
    { cor: "#10B981", nome: "Verde" },
    { cor: "#F59E0B", nome: "Amarelo" },
    { cor: "#8B5CF6", nome: "Roxo" },
    { cor: "#EC4899", nome: "Rosa" },
    { cor: "#14B8A6", nome: "Turquesa" },
    { cor: "#F97316", nome: "Laranja" },
    { cor: "#6366F1", nome: "Índigo" },
    { cor: "#84CC16", nome: "Lima" }
  ];
  return (
    <div className="space-y-2>
      <div className="grid grid-cols-5 gap-2>
        {coresPredefinidas.map((cor) => (
          <button
            key={cor.cor}
            type="button"
            onClick={() => onChange(cor.cor)}
            className={`w-8 h-8 rounded-full border-2 ${
              value === cor.cor ? 'border-gray-800' : 'border-gray-300'
            "
            style={{ backgroundColor: cor.cor }}
            title={cor.nome}
          />
        ))}
      </div>
      <Input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10"
      />
    </div>
  );
};
// Componente para gerenciar faixas de CEP
const FaixasCepManager = ({ faixas = [], onChange }) => {
  const [novaFaixa, setNovaFaixa] = useState({ cepInicio: '', cepFim: '', grupo: '' });
  const adicionarFaixa = () => {
    if (novaFaixa.cepInicio && novaFaixa.cepFim) {
      onChange([...faixas, { ...novaFaixa }]);
      setNovaFaixa({ cepInicio: '', cepFim: '', grupo: '' });
    }
  };
  const removerFaixa = (index) => {
    onChange(faixas.filter((_, i) => i !== index));
  };
  return (
    <div className="space-y-4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2>
        <Input
          placeholder="CEP Início"
          value={novaFaixa.cepInicio}
          onChange={(e) => setNovaFaixa({ ...novaFaixa, cepInicio: e.target.value })}
        />
        <Input
          placeholder="CEP Fim"
          value={novaFaixa.cepFim}
          onChange={(e) => setNovaFaixa({ ...novaFaixa, cepFim: e.target.value })}
        />
        <Input
          placeholder="Grupo (opcional)"
          value={novaFaixa.grupo}
          onChange={(e) => setNovaFaixa({ ...novaFaixa, grupo: e.target.value })}
        />
        <Button type="button" onClick={adicionarFaixa} size="sm>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>
      {faixas.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CEP Início</TableHead>
              <TableHead>CEP Fim</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faixas.map((faixa, index) => (
              <TableRow key={index}>
                <TableCell>{faixa.cepInicio}</TableCell>
                <TableCell>{faixa.cepFim}</TableCell>
                <TableCell>{faixa.grupo || '-'}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerFaixa(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
// Componente para gerenciar coordenadas de polígono
const CoordenadasManager = ({ coordenadas = [], onChange }) => {
  const [coordenadaSelecionada, setCoordenadaSelecionada] = useState(null);
  const adicionarCoordenada = (lat, lng) => {
    const novaCoordenada = {
      lat,
      lng,
      ordem: coordenadas.length + 1
    };
    onChange([...coordenadas, novaCoordenada]);
  };
  const removerCoordenada = (index) => {
    const novasCoordenadas = coordenadas.filter((_, i) => i !== index);
    // Reordenar
    const coordenadasReordenadas = novasCoordenadas.map((coord, i) => ({
      ...coord,
      ordem: i + 1
    }));
    onChange(coordenadasReordenadas);
  };
  return (
    <div className="space-y-4>
      <div className="h-96 border rounded-lg>
        <LeafletMapSelector
          initialLat={-23.5505}
          initialLng={-46.6333}
          onLocationSelect={adicionarCoordenada}
        />
      </div>
      {coordenadas.length > 0 && (
        <div>
          <h4 className="text-lg">"Coordenadas do Polígono ({coordenadas.length} pontos)</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coordenadas.map((coord, index) => (
                <TableRow key={index}>
                  <TableCell>{coord.ordem}</TableCell>
                  <TableCell>{coord.lat.toFixed(6)}</TableCell>
                  <TableCell>{coord.lng.toFixed(6)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerCoordenada(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {coordenadas.length < 3 && (
            <p className="text-sm text-amber-600 mt-2>
              Adicione pelo menos 3 coordenadas para formar um polígono válido
            </p>
          )}
        </div>
      )}
    </div>
  );
};
// Componente para configurar raio
const RaioManager = ({ coordenadaCentral, raioMetros, onCoordenadaChange, onRaioChange }) => {
  return (
    <div className="space-y-4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4>
        <div>
          <label className="text-lg">"Raio (metros)</label>
          <Input
            type="number"
            placeholder="Ex: 1000"
            value={raioMetros || ''}
            onChange={(e) => onRaioChange(parseInt(e.target.value))}
            min="1"
            max="100000"
          />
        </div>
        <div>
          <label className="text-lg">"Coordenada Central</label>
          {coordenadaCentral ? (
            <div className="text-sm>
              <p>Lat: {coordenadaCentral.lat.toFixed(6)}</p>
              <p>Lng: {coordenadaCentral.lng.toFixed(6)}</p>
            </div>
          ) : (
            <p className="text-lg">"Clique no mapa para definir o centro</p>
          )}
        </div>
      </div>
      <div className="h-96 border rounded-lg>
        <LeafletMapSelector
          initialLat={coordenadaCentral?.lat || -23.5505}
          initialLng={coordenadaCentral?.lng || -46.6333}
          onLocationSelect={(lat, lng) => onCoordenadaChange({ lat, lng })}
        />
      </div>
    </div>
  );
};
// Componente para upload de arquivos
const ArquivoUploader = ({ onArquivoUpload }) => {
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    const tiposPermitidos = ['kml', 'shp', 'geojson', 'json'];
    if (!tiposPermitidos.includes(extension)) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Use arquivos KML, SHP, GeoJSON ou JSON",
        variant: "destructive"
      });
      return;
    }
    // Simular processamento do arquivo
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let dadosGeograficos = null;
        
        if (extension === 'json' || extension === 'geojson') {
          dadosGeograficos = JSON.parse(e.target.result);
        } else {
          // Para KML e SHP, seria necessário usar bibliotecas específicas
          dadosGeograficos = { arquivo: file.name, conteudo: e.target.result };
        }
        onArquivoUpload({
          arquivoOriginal: file.name,
          tipoArquivo: extension === 'shp' ? 'shape' : extension,
          dadosGeograficos
        });
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: " foi processado`
        });
      } catch (error) {
        toast({
          title: '[TRANSLATION_NEEDED]',
          description: "Verifique se o arquivo está no formato correto",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };
  return (
    <div className="space-y-4>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center>
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600 mb-4>
          Arraste e solte um arquivo aqui ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500 mb-4>
          Formatos suportados: KML, SHP, GeoJSON
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="h-4 w-4 mr-2" />
          Selecionar Arquivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".kml,.shp,.geojson,.json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};
export default function AreaForm({ onSubmit, onCancel, isLoading = false }: AreaFormProps) {
  const form = useForm<NewArea>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      ativo: true,
      nome: "",
      descricao: "",
      codigoIntegracao: "",
      tipoArea: "coordenadas",
      corMapa: "#3B82F6",
      faixasCep: [],
      coordenadas: [],
      coordenadaCentral: null,
      raioMetros: null,
      linhaTrajetoria: [],
      arquivoOriginal: null,
      tipoArquivo: null
    }
  });
  const { handleSubmit, setValue, watch } = form;
  const tipoArea = useWatch({ control: form.control, name: 'tipoArea' });
  const corMapa = useWatch({ control: form.control, name: 'corMapa' });
  const tiposArea = [
    { value: "faixa_cep", label: "Faixa CEP", icon: MapPin },
    { value: "shape", label: "Shape", icon: Map },
    { value: "coordenadas", label: "Coordenadas", icon: Target },
    { value: "raio", label: "Raio", icon: Target },
    { value: "linha", label: "Linha", icon: Route },
    { value: "importar_area", label: "Importar Área", icon: Upload }
  ];
  const handleFormSubmit = (data: NewArea) => {
    console.log('AreaForm - Submitting data:', data);
    onSubmit(data);
  };
  const renderTipoAreaContent = () => {
    switch (tipoArea) {
      case 'faixa_cep':
        return (
          <FaixasCepManager
            faixas={watch('faixasCep') || []}
            onChange={(faixas) => setValue('faixasCep', faixas)}
          />
        );
      case 'coordenadas':
        return (
          <CoordenadasManager
            coordenadas={watch('coordenadas') || []}
            onChange={(coords) => setValue('coordenadas', coords)}
          />
        );
      case 'raio':
        return (
          <RaioManager
            coordenadaCentral={watch('coordenadaCentral')}
            raioMetros={watch('raioMetros')}
            onCoordenadaChange={(coord) => setValue('coordenadaCentral', coord)}
            onRaioChange={(raio) => setValue('raioMetros', raio)}
          />
        );
      case 'linha':
        return (
          <div className="text-center py-8 text-gray-500>
            <Route className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Funcionalidade de linha em desenvolvimento</p>
          </div>
        );
      case 'shape':
        return (
          <div className="text-center py-8 text-gray-500>
            <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Editor de shapes em desenvolvimento</p>
          </div>
        );
      case 'importar_area':
        return (
          <ArquivoUploader
            onArquivoUpload={(dadosArquivo) => {
              setValue('arquivoOriginal', dadosArquivo.arquivoOriginal);
              setValue('tipoArquivo', dadosArquivo.tipoArquivo);
              setValue('dadosGeograficos', dadosArquivo.dadosGeograficos);
            }}
          />
        );
      default:
        return null;
    }
  };
  return (
    <div className="max-w-6xl mx-auto p-6>
      <div className="mb-6>
        <h2 className="text-lg">"Nova Área</h2>
        <p className="text-lg">"Configure uma nova área geográfica com integração de mapa</p>
      </div>
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6>
          {/* Identificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2>
                <Map className="h-5 w-5" />
                Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4>
              <div className="flex items-center justify-between>
                <div className="space-y-0.5>
                  <label htmlFor="ativo" className="text-lg">"Status</label>
                  <div className="text-sm text-muted-foreground>
                    Área ativa no sistema
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Área *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Área Central SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="codigoIntegracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Integração</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: AREA_CENTRAL_001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva a área geográfica..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          {/* Classificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2>
                <Palette className="h-5 w-5" />
                Classificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6>
              {/* Tipo de Área */}
              <FormField
                control={form.control}
                name="tipoArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Área *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='[TRANSLATION_NEEDED]' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposArea.map((tipo) => {
                          const Icon = tipo.icon;
                          return (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              <div className="flex items-center gap-2>
                                <Icon className="h-4 w-4" />
                                {tipo.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Cor no Mapa */}
              <div>
                <label className="text-lg">"Cor no Mapa</label>
                <div className="flex items-center gap-4>
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: corMapa }}
                  />
                  <div className="flex-1>
                    <ColorPicker 
                      value={corMapa}
                      onChange={(cor) => setValue('corMapa', cor)}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              {/* Configuração específica do tipo */}
              <div>
                <h4 className="text-sm font-medium mb-4>
                  Configuração: {tiposArea.find(t => t.value === tipoArea)?.label}
                </h4>
                {renderTipoAreaContent()}
              </div>
            </CardContent>
          </Card>
          {/* Preview da Área */}
          {(watch('coordenadas')?.length > 0 || watch('coordenadaCentral') || watch('faixasCep')?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Preview da Área</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4 text-center>
                  <Map className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600>
                    Visualização da área será exibida aqui em tempo real
                  </p>
                  <Badge style={{ backgroundColor: corMapa, color: 'white' }} className="mt-2>
                    {tiposArea.find(t => t.value === tipoArea)?.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4 pt-4>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Criando..." : '[TRANSLATION_NEEDED]'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

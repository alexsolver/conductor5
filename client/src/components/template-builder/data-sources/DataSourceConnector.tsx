
/**
 * Conector de fontes de dados para campos do template builder
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Textarea } from '../../ui/textarea'
import { Switch } from '../../ui/switch'
import { Badge } from '../../ui/badge'
import { Alert, AlertDescription } from '../../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { 
import { useLocalization } from '@/hooks/useLocalization';
  Database, 
  Globe, 
  List, 
  Zap, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Code,
  Settings,
  Eye,
  Download
} from 'lucide-react'

interface DataSource {
  id: string
  name: string
  type: 'api' | 'database' | 'static' | 'function'
  config: {
    url?: string
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
    body?: string
    query?: string
    transform?: string
    cache?: boolean
    cacheDuration?: number
  }
  data?: any[]
  lastFetch?: Date
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
}

interface DataSourceConnectorProps {
  field: any
  onUpdate: (dataSource: DataSource) => void
  onClose: () => void
}

export const DataSourceConnector: React.FC<DataSourceConnectorProps> = ({
  const { t } = useLocalization();

  field,
  onUpdate,
  onClose
}) => {
  const [dataSource, setDataSource] = useState<DataSource>(
    field.dataSource || {
      id: `ds_${Date.now()}`,
      name: `Fonte de dados - ${field.label}`,
      type: 'static',
      config: {},
      status: 'idle'
    }
  )
  
  const [testResult, setTestResult] = useState<any[]>([])
  const [isTesting, setIsTesting] = useState(false)

  // Testar conexão com fonte de dados
  const testDataSource = async () => {
    setIsTesting(true)
    setDataSource(prev => ({ ...prev, status: 'loading', error: undefined }))

    try {
      let data: any[] = []

      switch (dataSource.type) {
        case 'api':
          data = await fetchFromAPI()
          break
        case 'database':
          data = await fetchFromDatabase()
          break
        case 'static':
          data = parseStaticData()
          break
        case 'function':
          data = await executeFunction()
          break
      }

      setTestResult(data)
      setDataSource(prev => ({
        ...prev,
        data,
        status: 'success',
        lastFetch: new Date()
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : {t('template-builder.erroDesconhecido')}
      setDataSource(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }))
    } finally {
      setIsTesting(false)
    }
  }

  // Buscar dados de API
  const fetchFromAPI = async (): Promise<any[]> => {
    const { url, method = 'GET', headers = {}, body } = dataSource.config

    if (!url) throw new Error('URL da API é obrigatória')

    const requestConfig: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (method === 'POST' && body) {
      requestConfig.body = body
    }

    const response = await fetch(url, requestConfig)

    if (!response.ok) {
      throw new Error({t('template-builder.erroHttpResponsestatusResponsestatustext')})
    }

    const data = await response.json()

    // Aplicar transformação se definida
    if (dataSource.config.transform) {
      return transformData(data, dataSource.config.transform)
    }

    // Se for array, retornar direto. Senão, tentar extrair array de propriedade
    if (Array.isArray(data)) {
      return data
    } else if (data.data && Array.isArray(data.data)) {
      return data.data
    } else if (data.items && Array.isArray(data.items)) {
      return data.items
    } else {
      return [data]
    }
  }

  // Buscar dados do banco de dados
  const fetchFromDatabase = async (): Promise<any[]> => {
    const { query } = dataSource.config

    if (!query) throw new Error('Query SQL é obrigatória')

    // Fazer requisição para endpoint do backend
    const response = await fetch('/api/data-sources/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      throw new Error({t('template-builder.erroNaConsultaResponsestatustext')})
    }

    const result = await response.json()
    return result.data || []
  }

  // Processar dados estáticos
  const parseStaticData = (): any[] => {
    const { body } = dataSource.config

    if (!body) return []

    try {
      const parsed = JSON.parse(body)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      // Se não for JSON válido, tratar como lista de texto
      return body.split('\n')
        .filter(line => line.trim())
        .map((line, index) => ({
          value: line.trim(),
          label: line.trim(),
          id: index
        }))
    }
  }

  // Executar função personalizada
  const executeFunction = async (): Promise<any[]> => {
    const { body } = dataSource.config

    if (!body) throw new Error('Código da função é obrigatório')

    try {
      // Contexto seguro para execução
      const context = {
        fetch: fetch.bind(window),
        console: console,
        Date: Date,
        Math: Math,
        JSON: JSON
      }

      const func = new Function('context', `
        with(context) {
          ${body}
        }
      `)

      const result = await func(context)
      return Array.isArray(result) ? result : [result]

    } catch (error) {
      throw new Error(`Erro na função: ${error instanceof Error ? error.message : {t('template-builder.erroDesconhecido')}}`)
    }
  }

  // Transformar dados
  const transformData = (data: any, transformCode: string): any[] => {
    try {
      const func = new Function('data', `
        return (function() {
          ${transformCode}
        }).call(this);
      `)
      
      return func(data) || []
    } catch (error) {
      throw new Error(`Erro na transformação: ${error instanceof Error ? error.message : {t('template-builder.erroDesconhecido')}}`)
    }
  }

  // Salvar e aplicar fonte de dados
  const handleSave = () => {
    onUpdate({
      ...dataSource,
      lastFetch: new Date()
    })
  }

  return (
    <div className="h-full flex flex-col bg-white border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Fonte de Dados</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="config" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="test">Teste</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Nome da Fonte</Label>
              <Input
                value={dataSource.name}
                onChange={(e) => setDataSource(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome descritivo da fonte de dados"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Tipo de Fonte</Label>
              <Select
                value={dataSource.type}
                onValueChange={(type: any) => setDataSource(prev => ({ 
                  ...prev, 
                  type,
                  config: {} 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      Lista Estática
                    </div>
                  </SelectItem>
                  <SelectItem value="api">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      API Externa
                    </div>
                  </SelectItem>
                  <SelectItem value="database">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Consulta no Banco
                    </div>
                  </SelectItem>
                  <SelectItem value="function">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Função Personalizada
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Static Data */}
            {dataSource.type === 'static' && (
              <div>
                <Label className="text-sm font-medium">Dados (JSON ou Lista)</Label>
                <Textarea
                  value={dataSource.config.body || ''}
                  onChange={(e) => setDataSource(prev => ({
                    ...prev,
                    config: { ...prev.config, body: e.target.value }
                  }))}
                  placeholder={`[
  {"value": "opt1", "label": "Opção 1"},
  {"value": "opt2", "label": "Opção 2"}
]

ou

Opção 1
Opção 2
Opção 3`}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* API Configuration */}
            {dataSource.type === 'api' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">URL da API</Label>
                  <Input
                    value={dataSource.config.url || ''}
                    onChange={(e) => setDataSource(prev => ({
                      ...prev,
                      config: { ...prev.config, url: e.target.value }
                    }))}
                    placeholder="https://api.exemplo.com/dados"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Método HTTP</Label>
                  <Select
                    value={dataSource.config.method || 'GET'}
                    onValueChange={(method: any) => setDataSource(prev => ({
                      ...prev,
                      config: { ...prev.config, method }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dataSource.config.method === 'POST' && (
                  <div>
                    <Label className="text-sm font-medium">Body (JSON)</Label>
                    <Textarea
                      value={dataSource.config.body || ''}
                      onChange={(e) => setDataSource(prev => ({
                        ...prev,
                        config: { ...prev.config, body: e.target.value }
                      }))}
                      placeholder='{"param": "value"}'
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Transformação (JavaScript)</Label>
                  <Textarea
                    value={dataSource.config.transform || ''}
                    onChange={(e) => setDataSource(prev => ({
                      ...prev,
                      config: { ...prev.config, transform: e.target.value }
                    }))}
                    placeholder={`return data.map(item => ({
  value: item.id,
  label: item.name
}))`}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Database Configuration */}
            {dataSource.type === 'database' && (
              <div>
                <Label className="text-sm font-medium">Query SQL</Label>
                <Textarea
                  value={dataSource.config.query || ''}
                  onChange={(e) => setDataSource(prev => ({
                    ...prev,
                    config: { ...prev.config, query: e.target.value }
                  }))}
                  placeholder={t('template-builder.selectIdNameFromTabelaWhereAtivoTrue')}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Function Configuration */}
            {dataSource.type === 'function' && (
              <div>
                <Label className="text-sm font-medium">Código JavaScript</Label>
                <Textarea
                  value={dataSource.config.body || ''}
                  onChange={(e) => setDataSource(prev => ({
                    ...prev,
                    config: { ...prev.config, body: e.target.value }
                  }))}
                  placeholder={`// Retorne um array de objetos
const data = await fetch('/api/dados').then(r => r.json());
return data.map(item => ({
  value: item.id,
  label: item.nome
}));`}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Cache Settings */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Cache de Dados</Label>
                <p className="text-xs text-gray-500">
                  Armazenar resultados em cache para melhor performance
                </p>
              </div>
              <Switch
                checked={dataSource.config.cache || false}
                onCheckedChange={(cache) => setDataSource(prev => ({
                  ...prev,
                  config: { ...prev.config, cache }
                }))}
              />
            </div>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Testar Fonte de Dados</h4>
              <Button 
                onClick={testDataSource} 
                disabled={isTesting}
                className="flex items-center gap-2"
              >
                {isTesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Testar
              </Button>
            </div>

            {dataSource.status === 'loading' && (
              <Alert>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <AlertDescription>
                  Testando conexão com a fonte de dados...
                </AlertDescription>
              </Alert>
            )}

            {dataSource.status === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Teste realizado com sucesso! {testResult.length} registro(s) encontrado(s).
                </AlertDescription>
              </Alert>
            )}

            {dataSource.status === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  Erro no teste: {dataSource.error}
                </AlertDescription>
              </Alert>
            )}

            {testResult.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Dados de Exemplo:</h5>
                <div className="bg-gray-50 p-3 rounded border max-h-60 overflow-y-auto">
                  <pre className="text-xs">
                    {JSON.stringify(testResult.slice(0, 5), null, 2)}
                  </pre>
                  {testResult.length > 5 && (
                    <p className="text-xs text-gray-500 mt-2">
                      ... e mais {testResult.length - 5} registro(s)
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="p-4 space-y-4">
            <div>
              <h4 className="font-medium mb-3">Preview do Campo</h4>
              <div className="border rounded p-4 bg-gray-50">
                <Label className="text-sm font-medium mb-2 block">
                  {field.label}
                </Label>
                
                {dataSource.data && dataSource.data.length > 0 ? (
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t('template-builder.selecioneUmaOpcao')} />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSource.data.slice(0, 10).map((item, index) => (
                        <SelectItem key={index} value={item.value || index}>
                          {item.label || item.value || String(item)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Teste a fonte de dados para ver as opções</p>
                  </div>
                )}
              </div>
            </div>

            {dataSource.lastFetch && (
              <p className="text-xs text-gray-500">
                Última atualização: {dataSource.lastFetch.toLocaleString('pt-BR')}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          Salvar Fonte de Dados
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export default DataSourceConnector

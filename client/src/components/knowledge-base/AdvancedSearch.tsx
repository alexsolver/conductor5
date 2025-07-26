/**
 * Advanced Search Component for Knowledge Base
 * Full-text search with filters and suggestions
 */

import { useState, useCallback, useEffect } from 'react'
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { 
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Tag,
  User,
  Star,
  TrendingUp,
  History
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SearchFilters {
  categories: string[]
  tags: string[]
  authors: string[]
  dateRange: {
    from?: Date
    to?: Date
  }
  rating: {
    min: number
    max: number
  }
  status: string[]
  sortBy: 'relevance' | 'date' | 'rating' | 'views'
  sortOrder: 'asc' | 'desc'
}

interface SearchSuggestion {
  type: 'article' | 'category' | 'tag' | 'recent'
  text: string
  count?: number
  icon?: React.ReactNode
}

interface SearchResult {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  author: string
  createdAt: Date
  rating: number
  views: number
  status: string
  highlights: string[]
}

interface AdvancedSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  results: SearchResult[]
  suggestions: SearchSuggestion[]
  searchHistory: string[]
  isLoading?: boolean
  onSearch: (query: string, filters: SearchFilters) => void
  onClearHistory: () => void
  availableCategories: { id: string; name: string; count: number }[]
  availableTags: { id: string; name: string; count: number }[]
  availableAuthors: { id: string; name: string; count: number }[]
}

export function AdvancedSearch({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  results,
  suggestions,
  searchHistory,
  isLoading = false,
  onSearch,
  onClearHistory,
  availableCategories,
  availableTags,
  availableAuthors
}: AdvancedSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [localQuery, setLocalQuery] = useState(searchQuery)

  // Update local query when prop changes
  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  const handleSearch = useCallback(() => {
    onSearch(localQuery, filters)
    setShowSuggestions(false)
  }, [localQuery, filters, onSearch])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setLocalQuery(suggestion.text)
    onSearchChange(suggestion.text)
    setShowSuggestions(false)
    onSearch(suggestion.text, filters)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      tags: [],
      authors: [],
      dateRange: {},
      rating: { min: 0, max: 5 },
      status: [],
      sortBy: 'relevance',
      sortOrder: 'desc'
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.tags.length > 0) count++
    if (filters.authors.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.rating.min > 0 || filters.rating.max < 5) count++
    if (filters.status.length > 0) count++
    return count
  }

  const highlightText = (text: string, highlights: string[]) => {
    if (!highlights.length) return text
    
    const regex = new RegExp(`(${highlights.join('|')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => {
      if (highlights.some(highlight => part.toLowerCase().includes(highlight.toLowerCase()))) {
        return <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
      }
      return part
    })
  }

  return (
    <div className="space-y-4">
      {/* Search Input with Suggestions */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value)
              onSearchChange(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Buscar na base de conhecimento..."
            className="pl-10 pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4" />
              {getActiveFiltersCount() > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                >
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
            <Button size="sm" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (localQuery.length > 0 || searchHistory.length > 0) && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
            <CardContent className="p-0">
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2 px-2">Sugestões</div>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.icon || <Search className="h-4 w-4 text-gray-400" />}
                      <span className="flex-1">{suggestion.text}</span>
                      {suggestion.count && (
                        <Badge variant="outline" className="text-xs">
                          {suggestion.count}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && (
                <>
                  {suggestions.length > 0 && <Separator />}
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <div className="text-xs font-medium text-gray-500">Histórico</div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={onClearHistory}
                        className="text-xs h-6"
                      >
                        Limpar
                      </Button>
                    </div>
                    {searchHistory.slice(0, 5).map((term, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
                        onClick={() => handleSuggestionClick({ type: 'recent', text: term })}
                      >
                        <History className="h-4 w-4 text-gray-400" />
                        <span className="flex-1">{term}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Advanced Filters */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros Avançados
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={clearAllFilters}>
                    Limpar Filtros
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Categories */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Categorias</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableCategories.map(category => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={filters.categories.includes(category.id)}
                          onCheckedChange={(checked) => {
                            const newCategories = checked
                              ? [...filters.categories, category.id]
                              : filters.categories.filter(c => c !== category.id)
                            handleFilterChange('categories', newCategories)
                          }}
                        />
                        <label 
                          htmlFor={`category-${category.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {category.name}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {category.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableTags.map(tag => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={filters.tags.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            const newTags = checked
                              ? [...filters.tags, tag.id]
                              : filters.tags.filter(t => t !== tag.id)
                            handleFilterChange('tags', newTags)
                          }}
                        />
                        <label 
                          htmlFor={`tag-${tag.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {tag.name}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {tag.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Authors */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Autores</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableAuthors.map(author => (
                      <div key={author.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`author-${author.id}`}
                          checked={filters.authors.includes(author.id)}
                          onCheckedChange={(checked) => {
                            const newAuthors = checked
                              ? [...filters.authors, author.id]
                              : filters.authors.filter(a => a !== author.id)
                            handleFilterChange('authors', newAuthors)
                          }}
                        />
                        <label 
                          htmlFor={`author-${author.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {author.name}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {author.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Data de Criação</label>
                  <div className="space-y-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? (
                            filters.dateRange.to ? (
                              <>
                                {format(filters.dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                                {format(filters.dateRange.to, "dd/MM/yy", { locale: ptBR })}
                              </>
                            ) : (
                              format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                          ) : (
                            "Selecionar período"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={filters.dateRange.from}
                          selected={{
                            from: filters.dateRange.from,
                            to: filters.dateRange.to
                          }}
                          onSelect={(range) => {
                            handleFilterChange('dateRange', {
                              from: range?.from,
                              to: range?.to
                            })
                          }}
                          numberOfMonths={2}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Rating Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Avaliação</label>
                  <div className="space-y-2">
                    <Select 
                      value={`${filters.rating.min}-${filters.rating.max}`}
                      onValueChange={(value) => {
                        const [min, max] = value.split('-').map(Number)
                        handleFilterChange('rating', { min, max })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-5">Todas as avaliações</SelectItem>
                        <SelectItem value="4-5">4+ estrelas</SelectItem>
                        <SelectItem value="3-5">3+ estrelas</SelectItem>
                        <SelectItem value="2-5">2+ estrelas</SelectItem>
                        <SelectItem value="1-5">1+ estrelas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select 
                    value={filters.status[0] || 'all'}
                    onValueChange={(value) => {
                      handleFilterChange('status', value === 'all' ? [] : [value])
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="review">Em revisão</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                  <div className="space-y-2">
                    <Select 
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onValueChange={(value) => {
                        const [sortBy, sortOrder] = value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder]
                        handleFilterChange('sortBy', sortBy)
                        handleFilterChange('sortOrder', sortOrder)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance-desc">Relevância</SelectItem>
                        <SelectItem value="date-desc">Mais recentes</SelectItem>
                        <SelectItem value="date-asc">Mais antigos</SelectItem>
                        <SelectItem value="rating-desc">Melhor avaliados</SelectItem>
                        <SelectItem value="views-desc">Mais visualizados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters Summary */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.categories.map(categoryId => {
            const category = availableCategories.find(c => c.id === categoryId)
            return category ? (
              <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {category.name}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-600" 
                  onClick={() => {
                    const newCategories = filters.categories.filter(c => c !== categoryId)
                    handleFilterChange('categories', newCategories)
                  }}
                />
              </Badge>
            ) : null
          })}

          {filters.tags.map(tagId => {
            const tag = availableTags.find(t => t.id === tagId)
            return tag ? (
              <Badge key={tagId} variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {tag.name}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-600" 
                  onClick={() => {
                    const newTags = filters.tags.filter(t => t !== tagId)
                    handleFilterChange('tags', newTags)
                  }}
                />
              </Badge>
            ) : null
          })}

          {filters.authors.map(authorId => {
            const author = availableAuthors.find(a => a.id === authorId)
            return author ? (
              <Badge key={authorId} variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {author.name}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-600" 
                  onClick={() => {
                    const newAuthors = filters.authors.filter(a => a !== authorId)
                    handleFilterChange('authors', newAuthors)
                  }}
                />
              </Badge>
            ) : null
          })}

          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {filters.dateRange.from && filters.dateRange.to
                ? `${format(filters.dateRange.from, "dd/MM", { locale: ptBR })} - ${format(filters.dateRange.to, "dd/MM", { locale: ptBR })}`
                : filters.dateRange.from
                ? `Desde ${format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })}`
                : `Até ${format(filters.dateRange.to!, "dd/MM/yyyy", { locale: ptBR })}`
              }
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-600" 
                onClick={() => handleFilterChange('dateRange', {})}
              />
            </Badge>
          )}

          {(filters.rating.min > 0 || filters.rating.max < 5) && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {filters.rating.min === filters.rating.max 
                ? `${filters.rating.min} estrelas`
                : `${filters.rating.min}-${filters.rating.max} estrelas`
              }
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-600" 
                onClick={() => handleFilterChange('rating', { min: 0, max: 5 })}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {results.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {results.length} resultado(s) encontrado(s)
              {searchQuery && ` para "${searchQuery}"`}
            </p>
          </div>
        )}

        {results.map(result => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg hover:text-blue-600 cursor-pointer">
                      {highlightText(result.title, result.highlights)}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Badge variant="outline">{result.category}</Badge>
                      <span>•</span>
                      <span>Por {result.author}</span>
                      <span>•</span>
                      <span>{format(result.createdAt, "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{result.rating.toFixed(1)}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{result.views}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 line-clamp-3">
                  {highlightText(result.content, result.highlights)}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {result.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Badge 
                    variant={result.status === 'published' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {result.status === 'published' ? 'Publicado' : 
                     result.status === 'draft' ? 'Rascunho' : 
                     result.status === 'review' ? 'Em revisão' : 'Arquivado'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {results.length === 0 && searchQuery && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
              <p className="text-gray-500 mb-4">
                Sua busca por "{searchQuery}" não retornou resultados.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Tente:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verificar a ortografia das palavras</li>
                  <li>Usar termos mais gerais</li>
                  <li>Remover alguns filtros</li>
                  <li>Pesquisar por sinônimos</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
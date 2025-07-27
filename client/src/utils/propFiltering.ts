/**
 * 🚨 CORREÇÃO CRÍTICA: Utilitário para filtragem consistente de props
 * Resolve inconsistências de componentes dinâmicos identificadas no QA
 */

export interface FilterableProps {
  [key: string]: any;
}

/**
 * Props que devem ser filtradas para evitar avisos do React
 * Estas props são específicas dos nossos componentes e não devem chegar ao DOM
 */
export const NON_DOM_PROPS = [
  'fieldName',
  'value', 
  'onValueChange',
  'showAllOption',
  'colorHex',
  'bgColor',
  'textColor'
] as const;

/**
 * Filtra props que não devem ser passadas para elementos DOM
 * @param props - Objeto com todas as props
 * @param additionalFilters - Props adicionais para filtrar
 * @returns Props limpas para serem passadas ao DOM
 */
export function filterDOMProps<T extends FilterableProps>(
  props: T, 
  additionalFilters: string[] = []
): Omit<T, typeof NON_DOM_PROPS[number]> {
  const allFilters = [...NON_DOM_PROPS, ...additionalFilters];
  const cleanProps = { ...props };
  
  allFilters.forEach(prop => {
    if (prop in cleanProps) {
      delete cleanProps[prop];
    }
  });
  
  return cleanProps;
}

/**
 * Hook para filtrar props de forma consistente em componentes
 * @param props - Props originais do componente
 * @param filters - Lista de props para filtrar
 * @returns Props limpas e props filtradas separadamente
 */
export function usePropsFiltering<T extends FilterableProps>(
  props: T,
  filters: (keyof T)[] = []
) {
  const filterKeys = [...NON_DOM_PROPS, ...filters] as (keyof T)[];
  
  const cleanProps = { ...props };
  const filteredProps: Partial<T> = {};
  
  filterKeys.forEach(key => {
    if (key in cleanProps) {
      filteredProps[key] = cleanProps[key];
      delete cleanProps[key];
    }
  });
  
  return {
    cleanProps,
    filteredProps
  };
}

/**
 * Padrão recomendado para componentes dinâmicos:
 * const { cleanProps, filteredProps } = usePropsFiltering(props, ['customProp']);
 */
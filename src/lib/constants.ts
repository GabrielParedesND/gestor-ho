// Constantes compartidas para categorías y tipos de contribución

export const CATEGORIES = [
  { value: 'TECHNICAL', label: 'Contribución Técnica' },
  { value: 'LEADERSHIP', label: 'Liderazgo y Mentoring' },
  { value: 'COLLABORATION', label: 'Colaboración y Trabajo en Equipo' },
  { value: 'INNOVATION', label: 'Innovación y Creatividad' },
  { value: 'IMPACT', label: 'Impacto en Resultados' }
] as const;

export const CONTRIBUTION_TYPES = [
  { value: 'DELIVERY', label: 'Entrega de Valor' },
  { value: 'QUALITY', label: 'Mejora de Calidad' },
  { value: 'EFFICIENCY', label: 'Eficiencia y Automatización' },
  { value: 'SUPPORT', label: 'Soporte y Ayuda' },
  { value: 'INITIATIVE', label: 'Proactividad e Iniciativa' }
] as const;

// Tipos derivados para TypeScript
export type CategoryValue = typeof CATEGORIES[number]['value'];
export type ContributionTypeValue = typeof CONTRIBUTION_TYPES[number]['value'];

// Funciones helper para obtener labels - más robustas
export const getCategoryLabel = (value: string): string => {
  const category = CATEGORIES.find(c => c.value === value);
  return category ? category.label : value;
};

export const getContributionTypeLabel = (value: string): string => {
  const contributionType = CONTRIBUTION_TYPES.find(t => t.value === value);
  return contributionType ? contributionType.label : value;
};

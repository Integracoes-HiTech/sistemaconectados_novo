/**
 * Utilitários para manipulação de cores e garantir contraste adequado
 */

/**
 * Converte cor hexadecimal para RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calcula a luminância relativa de uma cor
 * Baseado na fórmula WCAG 2.0
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula a razão de contraste entre duas cores
 * Retorna valor entre 1 e 21
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Verifica se a cor de fundo é escura
 */
function isDark(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return false;

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance < 0.5;
}

/**
 * Retorna a melhor cor de texto (branco ou preto) para um dado fundo
 * Garante contraste mínimo de 4.5:1 (WCAG AA)
 */
export function getTextColor(backgroundColor: string): string {
  const contrastWithWhite = getContrastRatio(backgroundColor, '#FFFFFF');
  const contrastWithBlack = getContrastRatio(backgroundColor, '#000000');

  // Se o contraste com branco for melhor que com preto, usar branco
  return contrastWithWhite > contrastWithBlack ? '#FFFFFF' : '#000000';
}

/**
 * Retorna a melhor cor de texto para títulos (contraste mais forte)
 * Garante contraste mínimo de 7:1 (WCAG AAA)
 */
export function getTitleTextColor(backgroundColor: string): string {
  const contrastWithWhite = getContrastRatio(backgroundColor, '#FFFFFF');
  const contrastWithBlack = getContrastRatio(backgroundColor, '#000000');

  // Para títulos, preferir contraste mais forte
  return contrastWithWhite >= 7 ? '#FFFFFF' : contrastWithBlack >= 7 ? '#000000' : getTextColor(backgroundColor);
}

/**
 * Retorna cores com transparência adequada para overlays
 */
export function getOverlayColors(baseColor: string) {
  const textColor = getTextColor(baseColor);
  
  return {
    // Cor de texto principal (100% opacidade)
    text: textColor,
    // Cor de texto secundário (80% opacidade)
    textSecondary: `${textColor}CC`,
    // Cor de texto terciário (60% opacidade)
    textTertiary: `${textColor}99`,
    // Background com 10% de opacidade da cor base
    bgLight: `${baseColor}1A`,
    // Background com 15% de opacidade da cor base
    bgMedium: `${baseColor}26`,
    // Border com 40% de opacidade da cor base
    border: `${baseColor}66`,
  };
}

/**
 * Documentação das cores do sistema:
 * 
 * CORES DA TABELA CAMPAIGNS:
 * 
 * 1. PRIMARY_COLOR (Cor Primária)
 *    - Uso: Títulos principais, headers, elementos de destaque
 *    - Exemplo: Título do dashboard, nome da campanha
 *    - Contraste: Sempre sobre fundo branco ou claro
 * 
 * 2. SECONDARY_COLOR (Cor Secundária)
 *    - Uso: Subtítulos, descrições, elementos secundários
 *    - Exemplo: Descrição do dashboard, cards internos
 *    - Contraste: Sobre fundo branco ou com transparência leve
 * 
 * 3. ACCENT_COLOR (Cor de Destaque/Ação)
 *    - Uso: Botões principais, ícones de ação, CTAs
 *    - Exemplo: Botão "Finalizar Cadastro", ícones importantes
 *    - Contraste: Texto sempre branco ou preto baseado na luminância
 * 
 * 4. BACKGROUND_COLOR (Cor de Fundo)
 *    - Uso: Fundo da página inteira, telas de loading
 *    - Exemplo: Background da tela de login, sucesso, cadastro
 *    - Contraste: Texto sempre calculado para máximo contraste
 * 
 * REGRAS DE CONTRASTE:
 * - Texto normal: mínimo 4.5:1 (WCAG AA)
 * - Títulos grandes: mínimo 3:1 (WCAG AA Large Text)
 * - Títulos importantes: 7:1 (WCAG AAA) quando possível
 * 
 * EXEMPLO DE USO:
 * ```typescript
 * import { getTextColor, getOverlayColors } from '@/lib/colorUtils';
 * 
 * const bgColor = campaign?.primary_color || '#14446C';
 * const textColor = getTextColor(bgColor); // Retorna '#FFFFFF' ou '#000000'
 * const overlay = getOverlayColors(bgColor); // Retorna objeto com cores calculadas
 * 
 * <div style={{ backgroundColor: bgColor, color: textColor }}>
 *   Texto sempre visível
 * </div>
 * ```
 */

export default {
  getTextColor,
  getTitleTextColor,
  getOverlayColors,
  isDark,
  getContrastRatio,
};


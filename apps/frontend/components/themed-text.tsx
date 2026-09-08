import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();
  const color = isDark ? (darkColor ?? theme.colors.text) : (lightColor ?? theme.colors.text);
  const typography = theme.typography;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? typography.bodyMedium : undefined,
        type === 'title' ? typography.displayMedium : undefined,
        type === 'defaultSemiBold' ? typography.labelLarge : undefined,
        type === 'subtitle' ? typography.headlineMedium : undefined,
        type === 'link' ? [typography.labelLarge, { color: theme.colors.primary }] : undefined,
        style,
      ]}
      maxFontSizeMultiplier={1.5}
      {...rest}
    />
  );
}


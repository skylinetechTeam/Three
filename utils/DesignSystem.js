import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS, RESPONSIVE } from '../config/theme';

/**
 * Design System Documentation and Testing Components
 */

// Design tokens showcase
export const DesignTokensShowcase = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Colors</Text>
        
        <View style={styles.colorGrid}>
          {Object.keys(COLORS.primary).map((shade) => (
            <View key={shade} style={styles.colorItem}>
              <View 
                style={[
                  styles.colorSwatch, 
                  { backgroundColor: COLORS.primary[shade] }
                ]} 
              />
              <Text style={styles.colorLabel}>primary.{shade}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.colorGrid}>
          {Object.keys(COLORS.semantic).map((color) => (
            <View key={color} style={styles.colorItem}>
              <View 
                style={[
                  styles.colorSwatch, 
                  { backgroundColor: COLORS.semantic[color] }
                ]} 
              />
              <Text style={styles.colorLabel}>{color}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Typography */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Typography</Text>
        
        {Object.keys(FONTS.styles).map((style) => (
          <View key={style} style={styles.typographyItem}>
            <Text style={[FONTS.styles[style], styles.typographySample]}>
              The quick brown fox jumps over the lazy dog
            </Text>
            <Text style={styles.typographyLabel}>
              {style} - {FONTS.styles[style].fontSize}px
            </Text>
          </View>
        ))}
      </View>

      {/* Spacing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spacing</Text>
        
        {Object.keys(SIZES.spacing).map((space) => (
          <View key={space} style={styles.spacingItem}>
            <View 
              style={[
                styles.spacingBar,
                { width: SIZES.spacing[space] }
              ]} 
            />
            <Text style={styles.spacingLabel}>
              {space}: {SIZES.spacing[space]}px
            </Text>
          </View>
        ))}
      </View>

      {/* Shadows */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shadows</Text>
        
        {Object.keys(SHADOWS).filter(s => s !== 'dark').map((shadow) => (
          <View key={shadow} style={styles.shadowItem}>
            <View style={[styles.shadowBox, SHADOWS[shadow]]} />
            <Text style={styles.shadowLabel}>{shadow}</Text>
          </View>
        ))}
      </View>

      {/* Icons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Icon Sizes</Text>
        
        {Object.keys(SIZES.icons).map((size) => (
          <View key={size} style={styles.iconItem}>
            <Ionicons 
              name="heart" 
              size={SIZES.icons[size]} 
              color={COLORS.primary[500]} 
            />
            <Text style={styles.iconLabel}>
              {size}: {SIZES.icons[size]}px
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// Component testing playground
export const ComponentPlayground = ({ children }) => {
  const [darkMode, setDarkMode] = React.useState(false);
  const [isSmallScreen, setIsSmallScreen] = React.useState(false);
  const [fontScale, setFontScale] = React.useState(1);

  return (
    <View style={styles.playground}>
      {/* Controls */}
      <View style={styles.playgroundControls}>
        <TouchableOpacity
          style={[styles.controlButton, darkMode && styles.controlButtonActive]}
          onPress={() => setDarkMode(!darkMode)}
        >
          <Ionicons name="moon" size={16} color={darkMode ? '#fff' : '#000'} />
          <Text style={styles.controlText}>Dark Mode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, isSmallScreen && styles.controlButtonActive]}
          onPress={() => setIsSmallScreen(!isSmallScreen)}
        >
          <Ionicons name="phone-portrait" size={16} color={isSmallScreen ? '#fff' : '#000'} />
          <Text style={styles.controlText}>Small Screen</Text>
        </TouchableOpacity>
      </View>

      {/* Component Area */}
      <View style={[
        styles.componentArea,
        darkMode && styles.componentAreaDark,
        isSmallScreen && styles.componentAreaSmall
      ]}>
        {children}
      </View>
    </View>
  );
};

// Visual regression testing helper
export const VisualTestCase = ({ name, description, children }) => {
  return (
    <View style={styles.testCase}>
      <View style={styles.testCaseHeader}>
        <Text style={styles.testCaseName}>{name}</Text>
        <Text style={styles.testCaseDescription}>{description}</Text>
      </View>
      <View style={styles.testCaseContent}>
        {children}
      </View>
    </View>
  );
};

// Accessibility audit component
export const AccessibilityAudit = ({ children }) => {
  const [auditResults, setAuditResults] = React.useState([]);

  React.useEffect(() => {
    // Simulate accessibility audit
    const results = [
      {
        type: 'success',
        message: 'All touch targets are at least 44pt',
        component: 'Buttons'
      },
      {
        type: 'warning',
        message: 'Some text has low contrast ratio',
        component: 'Typography'
      },
      {
        type: 'success',
        message: 'All interactive elements have accessibility labels',
        component: 'Forms'
      }
    ];
    setAuditResults(results);
  }, []);

  return (
    <View style={styles.auditContainer}>
      <Text style={styles.auditTitle}>Accessibility Audit</Text>
      
      {auditResults.map((result, index) => (
        <View key={index} style={styles.auditItem}>
          <Ionicons 
            name={result.type === 'success' ? 'checkmark-circle' : 'warning'} 
            size={20} 
            color={result.type === 'success' ? COLORS.semantic.success : COLORS.semantic.warning} 
          />
          <View style={styles.auditText}>
            <Text style={styles.auditMessage}>{result.message}</Text>
            <Text style={styles.auditComponent}>{result.component}</Text>
          </View>
        </View>
      ))}
      
      <View style={styles.auditContent}>
        {children}
      </View>
    </View>
  );
};

// Performance metrics display
export const PerformanceMetrics = () => {
  const [metrics, setMetrics] = React.useState({
    renderTime: '45ms',
    bundleSize: '2.3MB',
    jsHeapSize: '18.5MB',
    fps: '60fps'
  });

  return (
    <View style={styles.metricsContainer}>
      <Text style={styles.metricsTitle}>Performance Metrics</Text>
      
      <View style={styles.metricsGrid}>
        {Object.entries(metrics).map(([key, value]) => (
          <View key={key} style={styles.metricItem}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricLabel}>{key}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Responsive breakpoint tester
export const ResponsiveBreakpointTester = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState('standard');
  
  const breakpoints = [
    { name: 'small', width: 320 },
    { name: 'standard', width: 375 },
    { name: 'large', width: 414 },
    { name: 'tablet', width: 768 }
  ];

  return (
    <View style={styles.breakpointTester}>
      <Text style={styles.breakpointTitle}>Responsive Breakpoints</Text>
      
      <View style={styles.breakpointControls}>
        {breakpoints.map((bp) => (
          <TouchableOpacity
            key={bp.name}
            style={[
              styles.breakpointButton,
              currentBreakpoint === bp.name && styles.breakpointButtonActive
            ]}
            onPress={() => setCurrentBreakpoint(bp.name)}
          >
            <Text style={styles.breakpointButtonText}>
              {bp.name} ({bp.width}px)
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.breakpointInfo}>
        <Text style={styles.breakpointCurrent}>
          Current: {currentBreakpoint}
        </Text>
        <Text style={styles.breakpointDetails}>
          Screen size: {RESPONSIVE.getScreenSize()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface.background,
    padding: SIZES.spacing.lg,
  },
  
  section: {
    marginBottom: SIZES.spacing.xl,
  },
  
  sectionTitle: {
    ...FONTS.styles.h2,
    marginBottom: SIZES.spacing.lg,
    color: COLORS.text.primary,
  },
  
  // Color styles
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.md,
    marginBottom: SIZES.spacing.lg,
  },
  
  colorItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.small,
  },
  
  colorLabel: {
    ...FONTS.styles.caption,
    textAlign: 'center',
  },
  
  // Typography styles
  typographyItem: {
    marginBottom: SIZES.spacing.lg,
    padding: SIZES.spacing.md,
    backgroundColor: COLORS.surface.card,
    borderRadius: SIZES.radius.medium,
  },
  
  typographySample: {
    marginBottom: SIZES.spacing.sm,
  },
  
  typographyLabel: {
    ...FONTS.styles.caption,
    color: COLORS.text.light,
  },
  
  // Spacing styles
  spacingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
    gap: SIZES.spacing.md,
  },
  
  spacingBar: {
    height: 4,
    backgroundColor: COLORS.primary[500],
    borderRadius: 2,
  },
  
  spacingLabel: {
    ...FONTS.styles.body2,
  },
  
  // Shadow styles
  shadowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
    gap: SIZES.spacing.lg,
  },
  
  shadowBox: {
    width: 60,
    height: 40,
    backgroundColor: COLORS.surface.card,
    borderRadius: SIZES.radius.medium,
  },
  
  shadowLabel: {
    ...FONTS.styles.body1,
  },
  
  // Icon styles
  iconItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
    gap: SIZES.spacing.md,
  },
  
  iconLabel: {
    ...FONTS.styles.body2,
  },
  
  // Playground styles
  playground: {
    flex: 1,
    backgroundColor: COLORS.surface.background,
  },
  
  playgroundControls: {
    flexDirection: 'row',
    padding: SIZES.spacing.lg,
    gap: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.medium,
    backgroundColor: COLORS.surface.card,
    gap: SIZES.spacing.sm,
  },
  
  controlButtonActive: {
    backgroundColor: COLORS.primary[500],
  },
  
  controlText: {
    ...FONTS.styles.body2,
  },
  
  componentArea: {
    flex: 1,
    padding: SIZES.spacing.lg,
    backgroundColor: COLORS.surface.background,
  },
  
  componentAreaDark: {
    backgroundColor: '#000',
  },
  
  componentAreaSmall: {
    maxWidth: 320,
  },
  
  // Test case styles
  testCase: {
    marginBottom: SIZES.spacing.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.medium,
    overflow: 'hidden',
  },
  
  testCaseHeader: {
    padding: SIZES.spacing.lg,
    backgroundColor: COLORS.surface.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  testCaseName: {
    ...FONTS.styles.h3,
    marginBottom: SIZES.spacing.sm,
  },
  
  testCaseDescription: {
    ...FONTS.styles.body2,
    color: COLORS.text.secondary,
  },
  
  testCaseContent: {
    padding: SIZES.spacing.lg,
  },
  
  // Audit styles
  auditContainer: {
    backgroundColor: COLORS.surface.card,
    borderRadius: SIZES.radius.medium,
    padding: SIZES.spacing.lg,
    margin: SIZES.spacing.lg,
  },
  
  auditTitle: {
    ...FONTS.styles.h3,
    marginBottom: SIZES.spacing.lg,
  },
  
  auditItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.spacing.md,
    gap: SIZES.spacing.md,
  },
  
  auditText: {
    flex: 1,
  },
  
  auditMessage: {
    ...FONTS.styles.body1,
    marginBottom: SIZES.spacing.xs,
  },
  
  auditComponent: {
    ...FONTS.styles.caption,
    color: COLORS.text.light,
  },
  
  auditContent: {
    marginTop: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  // Metrics styles
  metricsContainer: {
    backgroundColor: COLORS.surface.card,
    borderRadius: SIZES.radius.medium,
    padding: SIZES.spacing.lg,
    margin: SIZES.spacing.lg,
  },
  
  metricsTitle: {
    ...FONTS.styles.h3,
    marginBottom: SIZES.spacing.lg,
    textAlign: 'center',
  },
  
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: SIZES.spacing.lg,
  },
  
  metricItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  
  metricValue: {
    ...FONTS.styles.h2,
    color: COLORS.primary[500],
    marginBottom: SIZES.spacing.xs,
  },
  
  metricLabel: {
    ...FONTS.styles.caption,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  
  // Breakpoint tester styles
  breakpointTester: {
    backgroundColor: COLORS.surface.card,
    borderRadius: SIZES.radius.medium,
    padding: SIZES.spacing.lg,
    margin: SIZES.spacing.lg,
  },
  
  breakpointTitle: {
    ...FONTS.styles.h3,
    marginBottom: SIZES.spacing.lg,
  },
  
  breakpointControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.lg,
  },
  
  breakpointButton: {
    padding: SIZES.spacing.md,
    backgroundColor: COLORS.surface.backgroundSecondary,
    borderRadius: SIZES.radius.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  breakpointButtonActive: {
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[500],
  },
  
  breakpointButtonText: {
    ...FONTS.styles.caption,
    fontWeight: '600',
  },
  
  breakpointInfo: {
    padding: SIZES.spacing.md,
    backgroundColor: COLORS.surface.backgroundSecondary,
    borderRadius: SIZES.radius.medium,
  },
  
  breakpointCurrent: {
    ...FONTS.styles.body1,
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs,
  },
  
  breakpointDetails: {
    ...FONTS.styles.body2,
    color: COLORS.text.secondary,
  },
});

export default {
  DesignTokensShowcase,
  ComponentPlayground,
  VisualTestCase,
  AccessibilityAudit,
  PerformanceMetrics,
  ResponsiveBreakpointTester,
};
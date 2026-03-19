import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const darkColors = {
	primary: '#6366F1',
	primaryDark: '#4F46E5',
	primaryLight: '#818CF8',
	primarySoft: '#E0E7FF',
	accent: '#F59E0B',
	accentDark: '#D97706',
	accentLight: '#FCD34D',
	success: '#10B981',
	successLight: '#D1FAE5',
	error: '#EF4444',
	errorLight: '#FEE2E2',
	errorDark: '#DC2626',
	background: '#0F172A',
	surface: '#1E293B',
	surfaceLight: '#334155',
	surfaceElevated: '#1E293B',
	card: '#1E293B',
	textPrimary: '#F1F5F9',
	textSecondary: '#CBD5E1', // HELER GEMACHT FÜR BESSERE LESBARKEIT (ursprünglich #94A3B8)
	textMuted: '#94A3B8',
	textInverse: '#0F172A',
	border: '#334155',
	borderLight: '#475569',
	gradientStart: '#6366F1',
	gradientEnd: '#8B5CF6',
	white: '#FFFFFF',
	black: '#000000',
	transparent: 'transparent',
};

export const lightColors = {
	primary: '#6366F1',
	primaryDark: '#4F46E5',
	primaryLight: '#818CF8',
	primarySoft: '#E0E7FF',
	accent: '#F59E0B',
	accentDark: '#D97706',
	accentLight: '#FCD34D',
	success: '#10B981',
	successLight: '#D1FAE5',
	error: '#EF4444',
	errorLight: '#FEE2E2',
	errorDark: '#DC2626',
	background: '#F8FAFC',
	surface: '#FFFFFF',
	surfaceLight: '#F1F5F9',
	surfaceElevated: '#FFFFFF',
	card: '#FFFFFF',
	textPrimary: '#0F172A',
	textSecondary: '#334155',
	textMuted: '#64748B',
	textInverse: '#F1F5F9',
	border: '#E2E8F0',
	borderLight: '#CBD5E1',
	gradientStart: '#6366F1',
	gradientEnd: '#8B5CF6',
	white: '#FFFFFF',
	black: '#000000',
	transparent: 'transparent',
};

// Vorerst bleibt `COLORS` noch da als Fallback-Verweis auf `darkColors`, 
// bis alle Dateien migriert sind, um Abstürze zu vermeiden.
export const COLORS = darkColors;

export const FONTS = {
	sizes: {
		xs: 11,
		sm: 13,
		md: 15,
		lg: 17,
		xl: 20,
		xxl: 24,
		xxxl: 32,
		hero: 40,
	},
	weights: {
		light: '300',
		regular: '400',
		medium: '500',
		semiBold: '600',
		bold: '700',
		extraBold: '800',
	},
};

export const SPACING = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	xxxl: 32,
	huge: 48,
};

export const RADIUS = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	full: 999,
};

export const SHADOWS = {
	sm: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 2,
	},
	md: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 4,
	},
	lg: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.25,
		shadowRadius: 16,
		elevation: 8,
	},
	glow: (color = COLORS.primary) => ({
		shadowColor: color,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 12,
		elevation: 6,
	}),
};

export const globalStyles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	screenPadding: {
		paddingHorizontal: SPACING.lg,
		paddingTop: SPACING.lg,
	},
	card: {
		backgroundColor: COLORS.card,
		borderRadius: RADIUS.lg,
		padding: SPACING.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		...SHADOWS.md,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	center: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	h1: {
		fontSize: FONTS.sizes.xxxl,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
	},
	h2: {
		fontSize: FONTS.sizes.xxl,
		fontWeight: FONTS.weights.semiBold,
		color: COLORS.textPrimary,
	},
	h3: {
		fontSize: FONTS.sizes.xl,
		fontWeight: FONTS.weights.semiBold,
		color: COLORS.textPrimary,
	},
	body: {
		fontSize: FONTS.sizes.md,
		color: COLORS.textSecondary,
		lineHeight: 22,
	},
	caption: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
	},
	input: {
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING.lg,
		paddingVertical: SPACING.md,
		fontSize: FONTS.sizes.md,
		color: COLORS.textPrimary,
	},
	divider: {
		height: 1,
		backgroundColor: COLORS.border,
		marginVertical: SPACING.lg,
	},
});

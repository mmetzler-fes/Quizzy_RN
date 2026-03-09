import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const COLORS = {
	// Primary palette
	primary: '#6366F1',       // Indigo
	primaryDark: '#4F46E5',
	primaryLight: '#818CF8',
	primarySoft: '#E0E7FF',

	// Accent
	accent: '#F59E0B',        // Amber
	accentDark: '#D97706',
	accentLight: '#FCD34D',

	// Success / Error
	success: '#10B981',
	successLight: '#D1FAE5',
	error: '#EF4444',
	errorLight: '#FEE2E2',
	errorDark: '#DC2626',

	// Neutrals
	background: '#0F172A',    // Dark slate
	surface: '#1E293B',
	surfaceLight: '#334155',
	surfaceElevated: '#1E293B',
	card: '#1E293B',

	// Text
	textPrimary: '#F1F5F9',
	textSecondary: '#94A3B8',
	textMuted: '#64748B',
	textInverse: '#0F172A',

	// Borders
	border: '#334155',
	borderLight: '#475569',

	// Gradients
	gradientStart: '#6366F1',
	gradientEnd: '#8B5CF6',

	white: '#FFFFFF',
	black: '#000000',
	transparent: 'transparent',
};

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

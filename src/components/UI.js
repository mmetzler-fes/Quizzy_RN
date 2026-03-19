import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	TextInput,
	ActivityIndicator,
	StyleSheet,
	Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

// === GRADIENT BUTTON ===
export function GradientButton({
	title,
	onPress,
	style,
	textStyle,
	disabled = false,
	icon,
	variant = 'primary', // 'primary', 'success', 'error', 'accent'
}) {
	const { colors } = useTheme();
	const gradients = {
		primary: [colors.primary, '#8B5CF6'],
		success: [colors.success, '#34D399'],
		error: [colors.error, '#F87171'],
		accent: [colors.accent, '#FBBF24'],
	};

	return (
		<TouchableOpacity
			onPress={onPress}
			disabled={disabled}
			activeOpacity={0.8}
			style={[styles.buttonWrapper, disabled && styles.buttonDisabled, style]}
		>
			<LinearGradient
				colors={disabled ? [colors.surfaceLight, colors.surfaceLight] : gradients[variant]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.gradientButton}
			>
				{icon && <View style={{ marginRight: SPACING.sm }}>{icon}</View>}
				<Text style={[styles.buttonText, { color: disabled ? colors.textMuted : colors.white }, textStyle]}>{title}</Text>
			</LinearGradient>
		</TouchableOpacity>
	);
}

// === CARD ===
export function Card({ children, style, onPress }) {
	const { colors } = useTheme();
	const Wrapper = onPress ? TouchableOpacity : View;
	return (
		<Wrapper
			onPress={onPress}
			activeOpacity={0.85}
			style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
		>
			{children}
		</Wrapper>
	);
}

// === STYLED INPUT ===
export function StyledInput({
	label,
	placeholder,
	value,
	onChangeText,
	style,
	multiline = false,
	...props
}) {
	const { colors } = useTheme();
	return (
		<View style={[styles.inputContainer, style]}>
			{label && <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>}
			<TextInput
				placeholder={placeholder}
				placeholderTextColor={colors.textMuted}
				value={value}
				onChangeText={onChangeText}
				multiline={multiline}
				style={[
					styles.input,
					{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
					multiline && { height: 100, textAlignVertical: 'top' },
				]}
				{...props}
			/>
		</View>
	);
}

// === BADGE ===
export function Badge({ text, variant = 'primary', style }) {
	const { colors } = useTheme();
	const bgColors = {
		primary: colors.primarySoft,
		success: colors.successLight,
		error: colors.errorLight,
		accent: '#FEF3C7',
	};
	const textColors = {
		primary: colors.primaryDark,
		success: '#065F46',
		error: colors.errorDark,
		accent: colors.accentDark,
	};

	return (
		<View style={[styles.badge, { backgroundColor: bgColors[variant] }, style]}>
			<Text style={[styles.badgeText, { color: textColors[variant] }]}>{text}</Text>
		</View>
	);
}

// === EMPTY STATE ===
export function EmptyState({ icon, title, subtitle }) {
	const { colors } = useTheme();
	return (
		<View style={styles.emptyState}>
			{icon && <Text style={styles.emptyIcon}>{icon}</Text>}
			<Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
			{subtitle && <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
		</View>
	);
}

// === LOADING ===
export function LoadingView({ message = 'Laden...' }) {
	const { colors } = useTheme();
	return (
		<View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
			<ActivityIndicator size="large" color={colors.primary} />
			<Text style={[styles.loadingText, { color: colors.textSecondary }]}>{message}</Text>
		</View>
	);
}

// === STATS CARD ===
export function StatsCard({ icon, value, label, color }) {
	const { colors } = useTheme();
	const activeColor = color || colors.primary;
	return (
		<View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: activeColor }]}>
			<Text style={styles.statsIcon}>{icon}</Text>
			<Text style={[styles.statsValue, { color: activeColor }]}>{value}</Text>
			<Text style={[styles.statsLabel, { color: colors.textMuted }]}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	// Button
	buttonWrapper: {
		borderRadius: RADIUS.md,
		overflow: 'hidden',
		...SHADOWS.sm,
	},
	gradientButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: SPACING.md + 2,
		paddingHorizontal: SPACING.xxl,
		borderRadius: RADIUS.md,
	},
	buttonText: {
		color: COLORS.white,
		fontSize: FONTS.sizes.md,
		fontWeight: FONTS.weights.semiBold,
		letterSpacing: 0.3,
	},
	buttonDisabled: {
		opacity: 0.5,
	},

	// Card
	card: {
		backgroundColor: COLORS.card,
		borderRadius: RADIUS.lg,
		padding: SPACING.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		...SHADOWS.md,
	},

	// Input
	inputContainer: {
		marginBottom: SPACING.lg,
	},
	inputLabel: {
		fontSize: FONTS.sizes.sm,
		fontWeight: FONTS.weights.semiBold,
		color: COLORS.textSecondary,
		marginBottom: SPACING.sm,
		letterSpacing: 0.5,
		textTransform: 'uppercase',
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

	// Badge
	badge: {
		paddingHorizontal: SPACING.md,
		paddingVertical: SPACING.xs,
		borderRadius: RADIUS.full,
		alignSelf: 'flex-start',
	},
	badgeText: {
		fontSize: FONTS.sizes.xs,
		fontWeight: FONTS.weights.semiBold,
		letterSpacing: 0.3,
	},

	// Empty state
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: SPACING.huge,
		paddingHorizontal: SPACING.xxl,
	},
	emptyIcon: {
		fontSize: 56,
		marginBottom: SPACING.lg,
	},
	emptyTitle: {
		fontSize: FONTS.sizes.xl,
		fontWeight: FONTS.weights.semiBold,
		color: COLORS.textPrimary,
		textAlign: 'center',
		marginBottom: SPACING.sm,
	},
	emptySubtitle: {
		fontSize: FONTS.sizes.md,
		color: COLORS.textMuted,
		textAlign: 'center',
		lineHeight: 22,
	},

	// Loading
	loadingContainer: {
		flex: 1,
		backgroundColor: COLORS.background,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		color: COLORS.textSecondary,
		fontSize: FONTS.sizes.md,
		marginTop: SPACING.lg,
	},

	// Stats
	statsCard: {
		backgroundColor: COLORS.card,
		borderRadius: RADIUS.lg,
		padding: SPACING.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderLeftWidth: 3,
		alignItems: 'center',
		flex: 1,
		...SHADOWS.sm,
	},
	statsIcon: {
		fontSize: 28,
		marginBottom: SPACING.sm,
	},
	statsValue: {
		fontSize: FONTS.sizes.xxl,
		fontWeight: FONTS.weights.bold,
	},
	statsLabel: {
		fontSize: FONTS.sizes.xs,
		color: COLORS.textMuted,
		marginTop: SPACING.xs,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
});

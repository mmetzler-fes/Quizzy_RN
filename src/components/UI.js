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
	const gradients = {
		primary: [COLORS.primary, '#8B5CF6'],
		success: [COLORS.success, '#34D399'],
		error: [COLORS.error, '#F87171'],
		accent: [COLORS.accent, '#FBBF24'],
	};

	return (
		<TouchableOpacity
			onPress={onPress}
			disabled={disabled}
			activeOpacity={0.8}
			style={[styles.buttonWrapper, disabled && styles.buttonDisabled, style]}
		>
			<LinearGradient
				colors={disabled ? [COLORS.surfaceLight, COLORS.surfaceLight] : gradients[variant]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.gradientButton}
			>
				{icon && <View style={{ marginRight: SPACING.sm }}>{icon}</View>}
				<Text style={[styles.buttonText, textStyle]}>{title}</Text>
			</LinearGradient>
		</TouchableOpacity>
	);
}

// === CARD ===
export function Card({ children, style, onPress }) {
	const Wrapper = onPress ? TouchableOpacity : View;
	return (
		<Wrapper
			onPress={onPress}
			activeOpacity={0.85}
			style={[styles.card, style]}
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
	return (
		<View style={[styles.inputContainer, style]}>
			{label && <Text style={styles.inputLabel}>{label}</Text>}
			<TextInput
				placeholder={placeholder}
				placeholderTextColor={COLORS.textMuted}
				value={value}
				onChangeText={onChangeText}
				multiline={multiline}
				style={[
					styles.input,
					multiline && { height: 100, textAlignVertical: 'top' },
				]}
				{...props}
			/>
		</View>
	);
}

// === BADGE ===
export function Badge({ text, variant = 'primary', style }) {
	const bgColors = {
		primary: COLORS.primarySoft,
		success: COLORS.successLight,
		error: COLORS.errorLight,
		accent: '#FEF3C7',
	};
	const textColors = {
		primary: COLORS.primaryDark,
		success: '#065F46',
		error: COLORS.errorDark,
		accent: COLORS.accentDark,
	};

	return (
		<View style={[styles.badge, { backgroundColor: bgColors[variant] }, style]}>
			<Text style={[styles.badgeText, { color: textColors[variant] }]}>{text}</Text>
		</View>
	);
}

// === EMPTY STATE ===
export function EmptyState({ icon, title, subtitle }) {
	return (
		<View style={styles.emptyState}>
			{icon && <Text style={styles.emptyIcon}>{icon}</Text>}
			<Text style={styles.emptyTitle}>{title}</Text>
			{subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
		</View>
	);
}

// === LOADING ===
export function LoadingView({ message = 'Laden...' }) {
	return (
		<View style={styles.loadingContainer}>
			<ActivityIndicator size="large" color={COLORS.primary} />
			<Text style={styles.loadingText}>{message}</Text>
		</View>
	);
}

// === STATS CARD ===
export function StatsCard({ icon, value, label, color = COLORS.primary }) {
	return (
		<View style={[styles.statsCard, { borderLeftColor: color }]}>
			<Text style={styles.statsIcon}>{icon}</Text>
			<Text style={[styles.statsValue, { color }]}>{value}</Text>
			<Text style={styles.statsLabel}>{label}</Text>
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

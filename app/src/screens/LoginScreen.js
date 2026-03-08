import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	Dimensions,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { GradientButton, StyledInput } from '../components/UI';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
	const [username, setUsername] = useState('');
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(50)).current;
	const logoScale = useRef(new Animated.Value(0.5)).current;
	const glowAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.sequence([
			Animated.parallel([
				Animated.spring(logoScale, {
					toValue: 1,
					friction: 4,
					tension: 40,
					useNativeDriver: true,
				}),
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
				}),
			]),
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 500,
				useNativeDriver: true,
			}),
		]).start();

		// Pulsing glow animation
		Animated.loop(
			Animated.sequence([
				Animated.timing(glowAnim, {
					toValue: 1,
					duration: 2000,
					useNativeDriver: true,
				}),
				Animated.timing(glowAnim, {
					toValue: 0,
					duration: 2000,
					useNativeDriver: true,
				}),
			])
		).start();
	}, []);

	const handleLogin = () => {
		if (username.trim()) {
			navigation.navigate('MainTabs', { username: username.trim() });
		}
	};

	return (
		<LinearGradient
			colors={[COLORS.background, '#1a1040', COLORS.background]}
			style={styles.container}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardView}
			>
				{/* Decorative circles */}
				<Animated.View style={[styles.decorCircle1, { opacity: glowAnim }]} />
				<Animated.View style={[styles.decorCircle2, { opacity: Animated.subtract(1, glowAnim) }]} />

				{/* Logo */}
				<Animated.View
					style={[
						styles.logoContainer,
						{
							opacity: fadeAnim,
							transform: [{ scale: logoScale }],
						},
					]}
				>
					<LinearGradient
						colors={[COLORS.primary, '#8B5CF6']}
						style={styles.logoGradient}
					>
						<Text style={styles.logoEmoji}>🧠</Text>
					</LinearGradient>
					<Text style={styles.title}>Quizzy</Text>
					<Text style={styles.subtitle}>Lerne smarter, nicht härter</Text>
				</Animated.View>

				{/* Login Form */}
				<Animated.View
					style={[
						styles.formContainer,
						{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
						},
					]}
				>
					<View style={styles.formCard}>
						<Text style={styles.welcomeText}>Willkommen!</Text>
						<Text style={styles.instructionText}>
							Gib deinen Namen ein, um loszulegen
						</Text>

						<StyledInput
							label="Benutzername"
							placeholder="Dein Name..."
							value={username}
							onChangeText={setUsername}
							returnKeyType="go"
							onSubmitEditing={handleLogin}
							autoCapitalize="words"
						/>

						<GradientButton
							title="Los geht's  →"
							onPress={handleLogin}
							disabled={!username.trim()}
							style={styles.loginButton}
						/>
					</View>
				</Animated.View>

				{/* Footer */}
				<Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
					<Text style={styles.footerText}>
						📚 Quiz • 📝 Vokabeln • 📊 Lernen
					</Text>
					<TouchableOpacity
						onPress={() => navigation.navigate('Admin')}
						style={styles.adminLink}
					>
						<Text style={styles.adminLinkText}>🔐 Lehrer-Bereich</Text>
					</TouchableOpacity>
				</Animated.View>
			</KeyboardAvoidingView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	keyboardView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: SPACING.xxl,
	},
	decorCircle1: {
		position: 'absolute',
		top: -80,
		right: -60,
		width: 260,
		height: 260,
		borderRadius: 130,
		backgroundColor: COLORS.primary,
		opacity: 0.08,
	},
	decorCircle2: {
		position: 'absolute',
		bottom: -100,
		left: -80,
		width: 300,
		height: 300,
		borderRadius: 150,
		backgroundColor: '#8B5CF6',
		opacity: 0.06,
	},
	logoContainer: {
		alignItems: 'center',
		marginBottom: SPACING.xxxl,
	},
	logoGradient: {
		width: 90,
		height: 90,
		borderRadius: 28,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING.lg,
		...SHADOWS.glow(COLORS.primary),
	},
	logoEmoji: {
		fontSize: 44,
	},
	title: {
		fontSize: FONTS.sizes.hero,
		fontWeight: FONTS.weights.extraBold,
		color: COLORS.white,
		letterSpacing: -1,
	},
	subtitle: {
		fontSize: FONTS.sizes.md,
		color: COLORS.textMuted,
		marginTop: SPACING.sm,
		letterSpacing: 0.5,
	},
	formContainer: {
		width: '100%',
		maxWidth: 400,
	},
	formCard: {
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.xl,
		padding: SPACING.xxl,
		borderWidth: 1,
		borderColor: COLORS.border,
		...SHADOWS.lg,
	},
	welcomeText: {
		fontSize: FONTS.sizes.xxl,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
		marginBottom: SPACING.xs,
	},
	instructionText: {
		fontSize: FONTS.sizes.md,
		color: COLORS.textMuted,
		marginBottom: SPACING.xxl,
	},
	loginButton: {
		marginTop: SPACING.sm,
	},
	footer: {
		marginTop: SPACING.xxxl,
		alignItems: 'center',
	},
	footerText: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		letterSpacing: 1,
	},
	adminLink: {
		marginTop: SPACING.lg,
		paddingVertical: SPACING.sm,
		paddingHorizontal: SPACING.xl,
		borderRadius: RADIUS.full,
		borderWidth: 1,
		borderColor: COLORS.error + '40',
		backgroundColor: COLORS.error + '10',
	},
	adminLinkText: {
		color: COLORS.error,
		fontSize: FONTS.sizes.sm,
		fontWeight: FONTS.weights.medium,
	},
});

import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	ScrollView,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Animated,
	Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { GradientButton, Card, LoadingView, EmptyState, Badge, StatsCard } from '../components/UI';
import { getQuizByName, getQuizNames, saveQuizResult } from '../database/database';

function shuffle(array) {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export default function QuizScreen({ route }) {
	const username = route?.params?.username || 'Spieler';
	const [quizNames, setQuizNames] = useState([]);
	const [selectedQuiz, setSelectedQuiz] = useState(null);
	const [quizData, setQuizData] = useState([]);
	const [shuffledAnswers, setShuffledAnswers] = useState([]);
	const [userAnswers, setUserAnswers] = useState({});
	const [submitted, setSubmitted] = useState(false);
	const [score, setScore] = useState(null);
	const [loading, setLoading] = useState(true);

	const fadeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		loadQuizNames();
	}, []);

	useEffect(() => {
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 600,
			useNativeDriver: true,
		}).start();
	}, [selectedQuiz, submitted]);

	const loadQuizNames = async () => {
		try {
			const names = await getQuizNames();
			setQuizNames(names);
			if (names.length > 0) {
				selectQuiz(names[0]);
			}
		} catch (error) {
			console.error('Error loading quiz names:', error);
		} finally {
			setLoading(false);
		}
	};

	const selectQuiz = async (name) => {
		setLoading(true);
		try {
			const data = await getQuizByName(name);
			setQuizData(data);
			setShuffledAnswers(shuffle(data));
			setSelectedQuiz(name);
			setUserAnswers({});
			setSubmitted(false);
			setScore(null);
			fadeAnim.setValue(0);
		} catch (error) {
			console.error('Error loading quiz:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async () => {
		// Check if all answers are filled
		const allFilled = quizData.every((_, idx) => userAnswers[idx] !== undefined && userAnswers[idx] !== '');
		if (!allFilled) {
			Alert.alert('Nicht komplett', 'Bitte fülle alle Zuordnungen aus, bevor du einreichst.');
			return;
		}

		// Calculate score and build details
		let correct = 0;
		const details = [];
		quizData.forEach((item, idx) => {
			const userInput = parseInt(userAnswers[idx]);
			const correctIndex = quizData.findIndex(q => q.id === shuffledAnswers[idx].id);
			const isCorrect = userInput === correctIndex;
			if (isCorrect) correct++;

			details.push({
				query: item.query,
				description: shuffledAnswers[idx].answer,
				userAnswer: userInput,
				correctAnswer: correctIndex,
				isCorrect,
			});
		});

		setScore(correct);
		setSubmitted(true);
		fadeAnim.setValue(0);

		// Save result to database
		try {
			await saveQuizResult(username, selectedQuiz, correct, quizData.length, details);
		} catch (error) {
			console.error('Error saving quiz result:', error);
		}
	};

	const handleRestart = () => {
		selectQuiz(selectedQuiz);
	};

	if (loading) return <LoadingView message="Quiz wird geladen..." />;

	if (quizNames.length === 0) {
		return (
			<View style={styles.container}>
				<EmptyState
					icon="📝"
					title="Keine Quizze vorhanden"
					subtitle="Füge zuerst Quiz-Fragen im Verwaltungsbereich hinzu."
				/>
			</View>
		);
	}

	// RESULT VIEW
	if (submitted) {
		const percentage = Math.round((score / quizData.length) * 100);
		const isPerfect = score === quizData.length;
		const isGood = percentage >= 70;

		return (
			<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
				<ScrollView contentContainerStyle={styles.resultContainer}>
					<Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
						<Text style={styles.resultEmoji}>
							{isPerfect ? '🏆' : isGood ? '👏' : '💪'}
						</Text>
						<Text style={styles.resultTitle}>
							{isPerfect ? 'Perfekt!' : isGood ? 'Gut gemacht!' : 'Weiter üben!'}
						</Text>
						<Text style={styles.resultSubtitle}>
							{username}, du hast {score} von {quizData.length} richtig!
						</Text>

						{/* Score circle */}
						<View style={[styles.scoreCircle, {
							borderColor: isPerfect ? COLORS.success : isGood ? COLORS.accent : COLORS.error
						}]}>
							<Text style={[styles.scorePercentage, {
								color: isPerfect ? COLORS.success : isGood ? COLORS.accent : COLORS.error
							}]}>
								{percentage}%
							</Text>
						</View>

						{/* Stats */}
						<View style={styles.statsRow}>
							<StatsCard icon="✅" value={score} label="Richtig" color={COLORS.success} />
							<View style={{ width: SPACING.md }} />
							<StatsCard icon="❌" value={quizData.length - score} label="Falsch" color={COLORS.error} />
						</View>

						{/* Detail: show correct answers */}
						<Card style={styles.detailCard}>
							<Text style={styles.detailTitle}>📋 Übersicht</Text>
							{quizData.map((item, idx) => {
								const userInput = parseInt(userAnswers[idx]);
								const correctIndex = quizData.findIndex(q => q.id === shuffledAnswers[idx].id);
								const isCorrect = userInput === correctIndex;

								return (
									<View key={idx} style={[styles.detailRow, { borderLeftColor: isCorrect ? COLORS.success : COLORS.error }]}>
										<View style={styles.detailHeader}>
											<Text style={styles.detailNumber}>#{idx}</Text>
											<Badge
												text={isCorrect ? 'Richtig' : 'Falsch'}
												variant={isCorrect ? 'success' : 'error'}
											/>
										</View>
										<Text style={styles.detailTerm}>{item.query}</Text>
										<Text style={styles.detailAnswer}>→ {shuffledAnswers[idx].answer}</Text>
										{!isCorrect && (
											<Text style={styles.detailCorrection}>
												Deine Antwort: {userAnswers[idx]}, Richtig: {correctIndex}
											</Text>
										)}
									</View>
								);
							})}
						</Card>

						<View style={styles.buttonRow}>
							<GradientButton
								title="🔄  Nochmal"
								onPress={handleRestart}
								variant="primary"
								style={{ flex: 1, marginRight: SPACING.sm }}
							/>
							<GradientButton
								title="📋  Anderes Quiz"
								onPress={() => { setSelectedQuiz(null); setSubmitted(false); }}
								variant="accent"
								style={{ flex: 1, marginLeft: SPACING.sm }}
							/>
						</View>
					</Animated.View>
				</ScrollView>
			</LinearGradient>
		);
	}

	// QUIZ SELECT VIEW
	if (!selectedQuiz) {
		return (
			<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
				<ScrollView contentContainerStyle={styles.selectContainer}>
					<Text style={styles.selectTitle}>Quiz auswählen</Text>
					<Text style={styles.selectSubtitle}>Wähle ein Quiz zum Lernen</Text>
					{quizNames.map((name) => (
						<Card key={name} onPress={() => selectQuiz(name)} style={styles.quizCard}>
							<View style={styles.quizCardContent}>
								<View>
									<Text style={styles.quizCardEmoji}>📚</Text>
								</View>
								<View style={{ flex: 1, marginLeft: SPACING.lg }}>
									<Text style={styles.quizCardTitle}>{name}</Text>
									<Text style={styles.quizCardDesc}>Tippe zum Starten</Text>
								</View>
								<Text style={styles.quizCardArrow}>→</Text>
							</View>
						</Card>
					))}
				</ScrollView>
			</LinearGradient>
		);
	}

	// QUIZ PLAY VIEW
	return (
		<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
			<ScrollView contentContainerStyle={styles.quizContainer}>
				<Animated.View style={{ opacity: fadeAnim }}>
					{/* Header */}
					<View style={styles.quizHeader}>
						<Badge text={selectedQuiz} variant="primary" />
						<Text style={styles.quizHeaderUser}>👤 {username}</Text>
					</View>

					<Text style={styles.quizTitle}>Zuordnungs-Quiz</Text>
					<Text style={styles.quizInstruction}>
						Ordne jeder Beschreibung (rechts) die passende Nummer des Begriffs (links) zu.
					</Text>

					{/* Table Header */}
					<View style={styles.tableHeader}>
						<View style={styles.colNum}>
							<Text style={styles.thText}>#</Text>
						</View>
						<View style={styles.colTerm}>
							<Text style={styles.thText}>Begriff</Text>
						</View>
						<View style={styles.colInput}>
							<Text style={styles.thText}>Nr.</Text>
						</View>
						<View style={styles.colDesc}>
							<Text style={styles.thText}>Beschreibung</Text>
						</View>
					</View>

					{/* Table Body */}
					{quizData.map((item, idx) => (
						<Animated.View
							key={idx}
							style={[
								styles.tableRow,
								idx % 2 === 0 && styles.tableRowAlt,
							]}
						>
							<View style={styles.colNum}>
								<View style={styles.numberBadge}>
									<Text style={styles.numberText}>{idx}</Text>
								</View>
							</View>
							<View style={styles.colTerm}>
								<Text style={styles.termText}>{item.query}</Text>
							</View>
							<View style={styles.colInput}>
								<TextInput
									style={styles.answerInput}
									keyboardType="number-pad"
									maxLength={2}
									placeholder="?"
									placeholderTextColor={COLORS.textMuted}
									value={userAnswers[idx]?.toString() || ''}
									onChangeText={(text) =>
										setUserAnswers({ ...userAnswers, [idx]: text })
									}
								/>
							</View>
							<View style={styles.colDesc}>
								<Text style={styles.descText} numberOfLines={3}>
									{shuffledAnswers[idx]?.answer}
								</Text>
							</View>
						</Animated.View>
					))}

					{/* Submit */}
					<GradientButton
						title="✅  Einreichen"
						onPress={handleSubmit}
						variant="success"
						style={styles.submitButton}
					/>
				</Animated.View>
			</ScrollView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	// Select view
	selectContainer: {
		padding: SPACING.xxl,
		paddingTop: SPACING.huge,
	},
	selectTitle: {
		fontSize: FONTS.sizes.xxxl,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
		marginBottom: SPACING.xs,
	},
	selectSubtitle: {
		fontSize: FONTS.sizes.md,
		color: COLORS.textMuted,
		marginBottom: SPACING.xxl,
	},
	quizCard: {
		marginBottom: SPACING.md,
	},
	quizCardContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	quizCardEmoji: {
		fontSize: 36,
	},
	quizCardTitle: {
		fontSize: FONTS.sizes.lg,
		fontWeight: FONTS.weights.semiBold,
		color: COLORS.textPrimary,
	},
	quizCardDesc: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		marginTop: 2,
	},
	quizCardArrow: {
		fontSize: FONTS.sizes.xxl,
		color: COLORS.primary,
		fontWeight: FONTS.weights.bold,
	},

	// Quiz view
	quizContainer: {
		padding: SPACING.lg,
		paddingBottom: SPACING.huge,
	},
	quizHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: SPACING.lg,
	},
	quizHeaderUser: {
		fontSize: FONTS.sizes.md,
		color: COLORS.textSecondary,
		fontWeight: FONTS.weights.medium,
	},
	quizTitle: {
		fontSize: FONTS.sizes.xxl,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
		marginBottom: SPACING.xs,
	},
	quizInstruction: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		marginBottom: SPACING.xl,
		lineHeight: 20,
	},

	// Table
	tableHeader: {
		flexDirection: 'row',
		backgroundColor: COLORS.primary,
		borderRadius: RADIUS.md,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		paddingVertical: SPACING.md,
		paddingHorizontal: SPACING.sm,
	},
	thText: {
		color: COLORS.white,
		fontSize: FONTS.sizes.sm,
		fontWeight: FONTS.weights.bold,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	tableRow: {
		flexDirection: 'row',
		backgroundColor: COLORS.surface,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
		paddingVertical: SPACING.md,
		paddingHorizontal: SPACING.sm,
		alignItems: 'center',
		minHeight: 60,
	},
	tableRowAlt: {
		backgroundColor: COLORS.surfaceLight + '40',
	},
	colNum: { width: 40, alignItems: 'center' },
	colTerm: { flex: 2, paddingHorizontal: SPACING.xs },
	colInput: { width: 50, alignItems: 'center' },
	colDesc: { flex: 3, paddingLeft: SPACING.sm },
	numberBadge: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: COLORS.primary + '30',
		alignItems: 'center',
		justifyContent: 'center',
	},
	numberText: {
		color: COLORS.primaryLight,
		fontSize: FONTS.sizes.sm,
		fontWeight: FONTS.weights.bold,
	},
	termText: {
		color: COLORS.textPrimary,
		fontSize: FONTS.sizes.sm,
		fontWeight: FONTS.weights.medium,
	},
	answerInput: {
		width: 40,
		height: 36,
		borderRadius: RADIUS.sm,
		borderWidth: 2,
		borderColor: COLORS.primary + '60',
		backgroundColor: COLORS.background,
		color: COLORS.white,
		textAlign: 'center',
		fontSize: FONTS.sizes.md,
		fontWeight: FONTS.weights.bold,
	},
	descText: {
		color: COLORS.textSecondary,
		fontSize: FONTS.sizes.xs,
		lineHeight: 16,
	},
	submitButton: {
		marginTop: SPACING.xxl,
	},

	// Result view
	resultContainer: {
		padding: SPACING.xxl,
		paddingTop: SPACING.huge,
		alignItems: 'center',
	},
	resultEmoji: {
		fontSize: 72,
		marginBottom: SPACING.lg,
	},
	resultTitle: {
		fontSize: FONTS.sizes.xxxl,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
		marginBottom: SPACING.sm,
	},
	resultSubtitle: {
		fontSize: FONTS.sizes.lg,
		color: COLORS.textSecondary,
		marginBottom: SPACING.xxl,
		textAlign: 'center',
	},
	scoreCircle: {
		width: 120,
		height: 120,
		borderRadius: 60,
		borderWidth: 4,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: SPACING.xxl,
		backgroundColor: COLORS.surface,
		...SHADOWS.lg,
	},
	scorePercentage: {
		fontSize: FONTS.sizes.xxxl,
		fontWeight: FONTS.weights.extraBold,
	},
	statsRow: {
		flexDirection: 'row',
		marginBottom: SPACING.xxl,
		width: '100%',
	},
	detailCard: {
		width: '100%',
		marginBottom: SPACING.xxl,
	},
	detailTitle: {
		fontSize: FONTS.sizes.lg,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
		marginBottom: SPACING.lg,
	},
	detailRow: {
		borderLeftWidth: 3,
		paddingLeft: SPACING.md,
		marginBottom: SPACING.lg,
	},
	detailHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: SPACING.xs,
	},
	detailNumber: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		fontWeight: FONTS.weights.bold,
	},
	detailTerm: {
		fontSize: FONTS.sizes.md,
		color: COLORS.textPrimary,
		fontWeight: FONTS.weights.semiBold,
	},
	detailAnswer: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textSecondary,
		marginTop: 2,
	},
	detailCorrection: {
		fontSize: FONTS.sizes.xs,
		color: COLORS.error,
		marginTop: 4,
		fontStyle: 'italic',
	},
	buttonRow: {
		flexDirection: 'row',
		width: '100%',
	},
});

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { Card, GradientButton, Badge, LoadingView, EmptyState } from '../components/UI';
import { getAllQuizItems, getQuizByName, getSelectedTopics } from '../database/database';

function shuffle(array) {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export default function VokabelLearnScreen() {
	const [vokabeln, setVokabeln] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [showAnswer, setShowAnswer] = useState(false);
	const [score, setScore] = useState({ correct: 0, wrong: 0 });
	const [finished, setFinished] = useState(false);

	const flipAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(0)).current;

	// Re-run every time this tab comes into focus so topic selection changes are picked up
	useFocusEffect(
		useCallback(() => {
			// Reset session state before loading new data
			setCurrentIndex(0);
			setShowAnswer(false);
			setScore({ correct: 0, wrong: 0 });
			setFinished(false);
			flipAnim.setValue(0);
			slideAnim.setValue(0);
			setLoading(true);
			loadData();
		}, [])
	);

	const loadData = async () => {
		try {
			const selectedTopics = await getSelectedTopics();
			let data;
			if (selectedTopics !== null) {
				if (selectedTopics.length > 0) {
					// Load items only from selected topics
					const allItems = await Promise.all(
						selectedTopics.map(name => getQuizByName(name))
					);
					data = allItems.flat();
				} else {
					data = [];
				}
			} else {
				// Fallback: load everything (no selection ever made)
				data = await getAllQuizItems();
			}
			setVokabeln(shuffle(data));
		} catch (error) {
			console.error('Error:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleFlip = () => {
		setShowAnswer(!showAnswer);
		Animated.spring(flipAnim, {
			toValue: showAnswer ? 0 : 1,
			friction: 6,
			tension: 40,
			useNativeDriver: true,
		}).start();
	};

	const handleAnswer = (correct) => {
		setScore((prev) => ({
			correct: prev.correct + (correct ? 1 : 0),
			wrong: prev.wrong + (correct ? 0 : 1),
		}));

		if (currentIndex + 1 >= vokabeln.length) {
			setFinished(true);
			return;
		}

		// Slide out animation
		Animated.timing(slideAnim, {
			toValue: correct ? -400 : 400,
			duration: 200,
			useNativeDriver: true,
		}).start(() => {
			setCurrentIndex((prev) => prev + 1);
			setShowAnswer(false);
			flipAnim.setValue(0);
			slideAnim.setValue(0);
		});
	};

	const handleRestart = () => {
		setVokabeln(shuffle(vokabeln));
		setCurrentIndex(0);
		setShowAnswer(false);
		setScore({ correct: 0, wrong: 0 });
		setFinished(false);
		flipAnim.setValue(0);
		slideAnim.setValue(0);
	};

	if (loading) return <LoadingView message="Vokabeln werden geladen..." />;

	if (vokabeln.length === 0) {
		return (
			<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
				<EmptyState
					icon="📖"
					title="Keine Einträge"
					subtitle="Füge zuerst Einträge unter 'Vokabeln' hinzu, um sie zu lernen."
				/>
			</LinearGradient>
		);
	}

	// FINISHED VIEW
	if (finished) {
		const total = score.correct + score.wrong;
		const percentage = Math.round((score.correct / total) * 100);

		return (
			<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
				<ScrollView contentContainerStyle={styles.resultContainer}>
					<Text style={styles.resultEmoji}>
						{percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '📚'}
					</Text>
					<Text style={styles.resultTitle}>Fertig!</Text>
					<Text style={styles.resultSubtitle}>
						Du hast {score.correct} von {total} Begriffen gewusst
					</Text>

					<View style={styles.resultCircle}>
						<Text style={[styles.resultPercent, {
							color: percentage >= 80 ? COLORS.success : percentage >= 50 ? COLORS.accent : COLORS.error
						}]}>{percentage}%</Text>
					</View>

					<View style={styles.resultStats}>
						<View style={[styles.resultStat, { borderLeftColor: COLORS.success }]}>
							<Text style={styles.resultStatNum}>{score.correct}</Text>
							<Text style={styles.resultStatLabel}>Gewusst ✅</Text>
						</View>
						<View style={[styles.resultStat, { borderLeftColor: COLORS.error }]}>
							<Text style={styles.resultStatNum}>{score.wrong}</Text>
							<Text style={styles.resultStatLabel}>Nicht gewusst ❌</Text>
						</View>
					</View>

					<GradientButton
						title="🔄  Nochmal lernen"
						onPress={handleRestart}
						style={{ width: '100%' }}
					/>
				</ScrollView>
			</LinearGradient>
		);
	}

	// CARD VIEW
	const current = vokabeln[currentIndex];
	const progress = (currentIndex + 1) / vokabeln.length;

	const frontInterpolate = flipAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '180deg'],
	});

	const backInterpolate = flipAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['180deg', '360deg'],
	});

	return (
		<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
			<View style={styles.learnContainer}>
				{/* Progress */}
				<View style={styles.progressHeader}>
					<Text style={styles.progressText}>
						Karte {currentIndex + 1} von {vokabeln.length}
					</Text>
					<View style={styles.scoreRow}>
						<Text style={styles.scoreGreen}>✅ {score.correct}</Text>
						<Text style={styles.scoreRed}>❌ {score.wrong}</Text>
					</View>
				</View>

				{/* Progress bar */}
				<View style={styles.progressBar}>
					<LinearGradient
						colors={[COLORS.primary, '#8B5CF6']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={[styles.progressFill, { width: `${progress * 100}%` }]}
					/>
				</View>

				{/* Flashcard */}
				<TouchableOpacity
					activeOpacity={0.9}
					onPress={handleFlip}
					style={styles.cardArea}
				>
					<Animated.View
						style={[
							styles.flashcard,
							{
								transform: [
									{ translateX: slideAnim },
									{ perspective: 1000 },
								],
							},
						]}
					>
						<LinearGradient
							colors={showAnswer ? ['#1E293B', '#334155'] : [COLORS.primary + '20', COLORS.primary + '10']}
							style={styles.flashcardInner}
						>
							<Text style={styles.flashcardLabel}>
								{showAnswer ? '💡 Antwort / Definition' : '❓ Begriff / Frage'}
							</Text>
							<Text style={styles.flashcardText}>
								{showAnswer ? current.answer : current.query}
							</Text>
							<Text style={styles.flashcardHint}>
								{showAnswer ? '' : 'Tippe zum Umdrehen'}
							</Text>
						</LinearGradient>
					</Animated.View>
				</TouchableOpacity>

				{/* Answer buttons */}
				{showAnswer && (
					<View style={styles.answerButtons}>
						<GradientButton
							title="❌ Nicht gewusst"
							onPress={() => handleAnswer(false)}
							variant="error"
							style={{ flex: 1, marginRight: SPACING.sm }}
						/>
						<GradientButton
							title="✅ Gewusst!"
							onPress={() => handleAnswer(true)}
							variant="success"
							style={{ flex: 1, marginLeft: SPACING.sm }}
						/>
					</View>
				)}
			</View>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	learnContainer: {
		flex: 1,
		padding: SPACING.xxl,
	},

	// Progress
	progressHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: SPACING.md,
	},
	progressText: {
		fontSize: FONTS.sizes.md,
		color: COLORS.textSecondary,
		fontWeight: FONTS.weights.medium,
	},
	scoreRow: {
		flexDirection: 'row',
		gap: SPACING.md,
	},
	scoreGreen: {
		fontSize: FONTS.sizes.md,
		color: COLORS.success,
		fontWeight: FONTS.weights.bold,
	},
	scoreRed: {
		fontSize: FONTS.sizes.md,
		color: COLORS.error,
		fontWeight: FONTS.weights.bold,
	},
	progressBar: {
		height: 6,
		backgroundColor: COLORS.surface,
		borderRadius: 3,
		marginBottom: SPACING.xxl,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		borderRadius: 3,
	},

	// Flashcard
	cardArea: {
		flex: 1,
		justifyContent: 'center',
	},
	flashcard: {
		borderRadius: RADIUS.xl,
		overflow: 'hidden',
		...SHADOWS.lg,
	},
	flashcardInner: {
		padding: SPACING.xxxl,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 250,
		borderRadius: RADIUS.xl,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	flashcardLabel: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		marginBottom: SPACING.xl,
		letterSpacing: 1,
		textTransform: 'uppercase',
	},
	flashcardText: {
		fontSize: FONTS.sizes.xl,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
		textAlign: 'center',
		lineHeight: 30,
	},
	flashcardHint: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		marginTop: SPACING.xl,
		fontStyle: 'italic',
	},

	// Answer buttons
	answerButtons: {
		flexDirection: 'row',
		marginTop: SPACING.xxl,
	},

	// Result
	resultContainer: {
		padding: SPACING.xxl,
		paddingTop: SPACING.huge * 1.5,
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
		textAlign: 'center',
		marginBottom: SPACING.xxl,
	},
	resultCircle: {
		width: 120,
		height: 120,
		borderRadius: 60,
		borderWidth: 4,
		borderColor: COLORS.primary,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.surface,
		marginBottom: SPACING.xxl,
		...SHADOWS.lg,
	},
	resultPercent: {
		fontSize: FONTS.sizes.xxxl,
		fontWeight: FONTS.weights.extraBold,
	},
	resultStats: {
		flexDirection: 'row',
		gap: SPACING.lg,
		marginBottom: SPACING.xxl,
		width: '100%',
	},
	resultStat: {
		flex: 1,
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		padding: SPACING.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderLeftWidth: 3,
		alignItems: 'center',
	},
	resultStatNum: {
		fontSize: FONTS.sizes.xxxl,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
	},
	resultStatLabel: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		marginTop: SPACING.xs,
	},
});

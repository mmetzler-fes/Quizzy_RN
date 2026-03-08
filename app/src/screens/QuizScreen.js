import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	Animated,
	Alert,
	Dimensions,
	PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { GradientButton, Card, LoadingView, EmptyState, Badge, StatsCard } from '../components/UI';
import { getQuizByName, getQuizNames, saveQuizResult } from '../database/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function shuffle(array) {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

// Draggable Component
function DraggableTerm({ term, index, onDragEnd, disabled }) {
	const pan = useRef(new Animated.ValueXY()).current;
	const scale = useRef(new Animated.Value(1)).current;
	const opacity = useRef(new Animated.Value(1)).current;

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => !disabled,
			onMoveShouldSetPanResponder: () => !disabled,
			onPanResponderGrant: () => {
				Animated.parallel([
					Animated.spring(scale, { toValue: 1.1, useNativeDriver: false }),
					Animated.timing(opacity, { toValue: 0.8, duration: 100, useNativeDriver: false }),
				]).start();
			},
			onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
			onPanResponderRelease: (e, gesture) => {
				Animated.parallel([
					Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
					Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
				]).start();

				// Calculate drop position
				const dropX = gesture.moveX;
				const dropY = gesture.moveY;

				onDragEnd(index, dropX, dropY);

				// Reset position
				Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
			},
		})
	).current;

	return (
		<Animated.View
			{...panResponder.panHandlers}
			style={[
				styles.draggableTerm,
				disabled && styles.draggableTermDisabled,
				{
					transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scale }],
					opacity: opacity,
					zIndex: 1000,
				},
			]}
		>
			<Text style={styles.draggableTermText}>{term}</Text>
		</Animated.View>
	);
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
	const [dropZones, setDropZones] = useState({});

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scrollRef = useRef(null);

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
			setDropZones({});
			fadeAnim.setValue(0);
		} catch (error) {
			console.error('Error loading quiz:', error);
		} finally {
			setLoading(false);
		}
	};

	const onLayoutDropZone = (idx, event) => {
		const { x, y, width, height } = event.nativeEvent.layout;
		// Since we are in a ScrollView, we need absolute coordinates
		// We'll use measure to get them if needed, but for now let's use a simpler approach
		// or measure the view when needed.
	};

	const handleDragEnd = (termIdx, x, y) => {
		// Collision detection
		let matchedIdx = -1;

		// We need to measure all dropzones relative to screen
		// This is tricky in a ScrollView. A better way in RN for DnD is to use a matching interaction.
		// For now, let's try to find the row by layout.

		// Optimization: Find which row the point {x, y} is in.
		Object.keys(dropZones).forEach((idx) => {
			const zone = dropZones[idx];
			if (
				x >= zone.px &&
				x <= zone.px + zone.width &&
				y >= zone.py &&
				y <= zone.py + zone.height
			) {
				matchedIdx = parseInt(idx);
			}
		});

		if (matchedIdx !== -1) {
			setUserAnswers((prev) => ({ ...prev, [matchedIdx]: termIdx }));
		}
	};

	const registerDropZone = (idx, ref) => {
		if (ref) {
			ref.measure((x, y, width, height, px, py) => {
				setDropZones((prev) => ({
					...prev,
					[idx]: { px, py, width, height }
				}));
			});
		}
	};

	const handleSubmit = async () => {
		// Check if all answers are filled
		const allFilled = quizData.every((_, idx) => userAnswers[idx] !== undefined && userAnswers[idx] !== '');
		if (!allFilled) {
			Alert.alert('Nicht komplett', 'Bitte fülle alle Zuordnungen aus (Drag & Drop), bevor du einreichst.');
			return;
		}

		let correct = 0;
		const details = [];
		quizData.forEach((item, idx) => {
			const userInput = parseInt(userAnswers[idx]);
			const correctIndex = quizData.findIndex(q => q.id === shuffledAnswers[idx].id);
			const isCorrect = userInput === correctIndex;
			if (isCorrect) correct++;

			details.push({
				query: quizData[userInput].query,
				description: shuffledAnswers[idx].answer,
				userAnswer: userInput,
				correctAnswer: correctIndex,
				isCorrect,
			});
		});

		setScore(correct);
		setSubmitted(true);
		fadeAnim.setValue(0);

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

						<View style={[styles.scoreCircle, {
							borderColor: isPerfect ? COLORS.success : isGood ? COLORS.accent : COLORS.error
						}]}>
							<Text style={[styles.scorePercentage, {
								color: isPerfect ? COLORS.success : isGood ? COLORS.accent : COLORS.error
							}]}>
								{percentage}%
							</Text>
						</View>

						<View style={styles.statsRow}>
							<StatsCard icon="✅" value={score} label="Richtig" color={COLORS.success} />
							<View style={{ width: SPACING.md }} />
							<StatsCard icon="❌" value={quizData.length - score} label="Falsch" color={COLORS.error} />
						</View>

						<Card style={styles.detailCard}>
							<Text style={styles.detailTitle}>📋 Übersicht</Text>
							{shuffledAnswers.map((item, idx) => {
								const userInputIdx = userAnswers[idx];
								const correctIndex = quizData.findIndex(q => q.id === item.id);
								const isCorrect = userInputIdx === correctIndex;

								return (
									<View key={idx} style={[styles.detailRow, { borderLeftColor: isCorrect ? COLORS.success : COLORS.error }]}>
										<View style={styles.detailHeader}>
											<Text style={styles.detailNumber}>#{idx + 1}</Text>
											<Badge
												text={isCorrect ? 'Richtig' : 'Falsch'}
												variant={isCorrect ? 'success' : 'error'}
											/>
										</View>
										<Text style={styles.detailAnswer}>{item.answer}</Text>
										<Text style={styles.detailTerm}>
											Deine Wahl: <Text style={{ fontWeight: 'bold' }}>{quizData[userInputIdx]?.query || '?'}</Text>
										</Text>
										{!isCorrect && (
											<Text style={styles.detailCorrection}>
												Richtig wäre: {quizData[correctIndex].query}
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
			<View style={styles.poolContainer}>
				<Text style={styles.poolTitle}>💡 Begriffe ziehen:</Text>
				<View style={styles.poolWrapper}>
					{quizData.map((item, idx) => {
						const isUsed = Object.values(userAnswers).includes(idx);
						return (
							<DraggableTerm
								key={idx}
								term={item.query}
								index={idx}
								onDragEnd={handleDragEnd}
								disabled={submitted}
							/>
						);
					})}
				</View>
			</View>

			<ScrollView
				ref={scrollRef}
				contentContainerStyle={styles.quizContainer}
				onScroll={() => {
					// Re-measure drop zones when scrolling
					// In a real app we'd use a more stable DnD lib, but for this custom impl:
					// We'll just wait for the drag finish which triggers the screen-space measurements
				}}
				scrollEventThrottle={16}
			>
				<Animated.View style={{ opacity: fadeAnim }}>
					{/* Header */}
					<View style={styles.quizHeader}>
						<Badge text={selectedQuiz} variant="primary" />
						<Text style={styles.quizHeaderUser}>👤 {username}</Text>
					</View>

					<Text style={styles.quizTitle}>Zuordnungs-Quiz</Text>
					<Text style={styles.quizInstruction}>
						Ziehe die Begriffe von oben (Drag & Drop) auf das Fragezeichen-Feld der passenden Beschreibung.
					</Text>

					{/* Table Body */}
					{shuffledAnswers.map((item, idx) => (
						<View
							key={idx}
							style={[
								styles.tableRow,
								idx % 2 === 0 && styles.tableRowAlt,
							]}
						>
							<View style={styles.colDrop}>
								<View
									ref={(ref) => registerDropZone(idx, ref)}
									style={[
										styles.dropZone,
										userAnswers[idx] !== undefined && styles.dropZoneFilled
									]}
								>
									<Text style={styles.dropZoneText}>
										{userAnswers[idx] !== undefined ? quizData[userAnswers[idx]].query : '?'}
									</Text>
								</View>
								{userAnswers[idx] !== undefined && (
									<TouchableOpacity
										onPress={() => {
											const newAnswers = { ...userAnswers };
											delete newAnswers[idx];
											setUserAnswers(newAnswers);
										}}
										style={styles.clearBtn}
									>
										<Text style={styles.clearBtnText}>✕</Text>
									</TouchableOpacity>
								)}
							</View>
							<View style={styles.colDesc}>
								<Text style={styles.descText}>
									{item.answer}
								</Text>
							</View>
						</View>
					))}

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
	// Pool
	poolContainer: {
		padding: SPACING.md,
		backgroundColor: COLORS.surface,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
		...SHADOWS.md,
	},
	poolTitle: {
		color: COLORS.textMuted,
		fontSize: FONTS.sizes.sm,
		fontWeight: FONTS.weights.bold,
		marginBottom: SPACING.sm,
		textTransform: 'uppercase',
	},
	poolWrapper: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: SPACING.sm,
	},
	draggableTerm: {
		paddingVertical: SPACING.sm,
		paddingHorizontal: SPACING.md,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary,
		borderWidth: 1,
		borderColor: COLORS.primaryLight,
		...SHADOWS.glow(COLORS.primary),
	},
	draggableTermDisabled: {
		opacity: 0.5,
	},
	draggableTermText: {
		color: COLORS.white,
		fontWeight: FONTS.weights.bold,
		fontSize: FONTS.sizes.sm,
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

	// Table DnD
	tableRow: {
		flexDirection: 'row',
		backgroundColor: COLORS.surface,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.border,
		paddingVertical: SPACING.lg,
		paddingHorizontal: SPACING.sm,
		alignItems: 'center',
		minHeight: 80,
	},
	tableRowAlt: {
		backgroundColor: COLORS.surfaceLight + '40',
	},
	colDrop: {
		width: 140,
		alignItems: 'center',
		flexDirection: 'row',
	},
	dropZone: {
		flex: 1,
		height: 44,
		borderRadius: RADIUS.md,
		borderWidth: 2,
		borderStyle: 'dashed',
		borderColor: COLORS.primary + '60',
		backgroundColor: COLORS.background,
		alignItems: 'center',
		justifyContent: 'center',
	},
	dropZoneFilled: {
		borderStyle: 'solid',
		borderColor: COLORS.success,
		backgroundColor: COLORS.success + '10',
	},
	dropZoneText: {
		color: COLORS.textMuted,
		fontSize: FONTS.sizes.xs,
		textAlign: 'center',
		fontWeight: FONTS.weights.bold,
	},
	clearBtn: {
		marginLeft: SPACING.xs,
		padding: SPACING.xs,
	},
	clearBtnText: {
		color: COLORS.error,
		fontSize: 18,
	},
	colDesc: {
		flex: 1,
		paddingLeft: SPACING.md,
	},
	descText: {
		color: COLORS.textSecondary,
		fontSize: FONTS.sizes.sm,
		lineHeight: 20,
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
		fontSize: FONTS.sizes.sm,
		color: COLORS.textSecondary,
		marginTop: 4,
	},
	detailAnswer: {
		fontSize: FONTS.sizes.md,
		color: COLORS.textPrimary,
		fontWeight: FONTS.weights.semiBold,
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

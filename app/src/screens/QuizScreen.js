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

// Draggable Vocabulary Term
function DraggableTerm({ term, index, onDragEnd, disabled }) {
	const pan = useRef(new Animated.ValueXY()).current;
	const scale = useRef(new Animated.Value(1)).current;
	const zIndex = useRef(new Animated.Value(1)).current;

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => !disabled,
			onMoveShouldSetPanResponder: () => !disabled,
			onPanResponderGrant: () => {
				zIndex.setValue(1000);
				Animated.spring(scale, { toValue: 1.05, useNativeDriver: false }).start();
			},
			onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
			onPanResponderRelease: (e, gesture) => {
				// Calculate drop position
				const dropX = gesture.moveX;
				const dropY = gesture.moveY;

				onDragEnd(index, dropX, dropY);

				// Reset position and appearance
				Animated.parallel([
					Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }),
					Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
				]).start(() => zIndex.setValue(1));
			},
		})
	).current;

	return (
		<Animated.View
			{...panResponder.panHandlers}
			style={[
				styles.draggableVocab,
				{
					transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: scale }],
					zIndex: zIndex,
				},
			]}
		>
			<View style={styles.vocabNumBadge}>
				<Text style={styles.vocabNumText}>{index + 1}</Text>
			</View>
			<Text style={styles.vocabText}>{term}</Text>
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
		const allFilled = quizData.every((_, idx) => userAnswers[idx] !== undefined);
		if (!allFilled) {
			Alert.alert('Nicht komplett', 'Bitte ziehe alle Begriffe auf die Fragezeichen.');
			return;
		}

		let correct = 0;
		const details = [];
		quizData.forEach((_, idx) => {
			const userInputIdx = userAnswers[idx];
			const correctIndex = quizData.findIndex(q => q.id === shuffledAnswers[idx].id);
			const isCorrect = userInputIdx === correctIndex;
			if (isCorrect) correct++;

			details.push({
				query: quizData[userInputIdx].query,
				description: shuffledAnswers[idx].answer,
				userAnswer: userInputIdx,
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
										<View style={styles.detailTermRow}>
											<Text style={styles.detailTermLabel}>Deine Wahl:</Text>
											<Text style={[styles.detailTermValue, { color: isCorrect ? COLORS.success : COLORS.error }]}>
												({userInputIdx + 1}) {quizData[userInputIdx]?.query}
											</Text>
										</View>
										{!isCorrect && (
											<Text style={styles.detailCorrection}>
												Richtig wäre: ({correctIndex + 1}) {quizData[correctIndex].query}
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
					{quizNames.map((name) => (
						<Card key={name} onPress={() => selectQuiz(name)} style={styles.quizCard}>
							<View style={styles.quizCardContent}>
								<Text style={styles.quizCardEmoji}>📚</Text>
								<View style={{ flex: 1, marginLeft: SPACING.lg }}>
									<Text style={styles.quizCardTitle}>{name}</Text>
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
						Ziehe die Begriffe von links auf die Fragezeichen im rechten Bereich.
					</Text>

					{/* Table Headers */}
					<View style={styles.tableHeader}>
						<Text style={[styles.thText, { width: 40 }]}>#</Text>
						<Text style={[styles.thText, { flex: 1 }]}>Begriff (Ziehen)</Text>
						<Text style={[styles.thText, { flex: 1.5, marginLeft: 20 }]}>Beschreibung</Text>
						<Text style={[styles.thText, { width: 80, textAlign: 'center' }]}>Ziel (?)</Text>
					</View>

					{/* Table Rows */}
					{shuffledAnswers.map((item, idx) => (
						<View key={idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
							{/* Index */}
							<View style={{ width: 40, alignItems: 'center' }}>
								<Text style={styles.detailNumber}>#{idx + 1}</Text>
							</View>

							{/* Draggable Term Section (Left) */}
							<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
								{idx < quizData.length ? (
									<DraggableTerm
										term={quizData[idx].query}
										index={idx}
										onDragEnd={handleDragEnd}
										disabled={submitted}
									/>
								) : <View style={{ flex: 1 }} />}
							</View>

							{/* Description Section (Middle) */}
							<View style={{ flex: 1.5, paddingHorizontal: SPACING.md }}>
								<Text style={styles.descText}>{item.answer}</Text>
							</View>

							{/* Drop Zone Section (Right) */}
							<View style={styles.colDrop}>
								<View
									ref={(ref) => registerDropZone(idx, ref)}
									style={[
										styles.dropZone,
										userAnswers[idx] !== undefined && styles.dropZoneFilled
									]}
								>
									<Text style={styles.dropZoneText}>
										{userAnswers[idx] !== undefined ? (userAnswers[idx] + 1) : '?'}
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
	container: { flex: 1 },
	// Select view
	selectContainer: { padding: SPACING.xxl, paddingTop: SPACING.huge },
	selectTitle: { fontSize: FONTS.sizes.xxxl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: SPACING.xxl },
	quizCard: { marginBottom: SPACING.md },
	quizCardContent: { flexDirection: 'row', alignItems: 'center' },
	quizCardEmoji: { fontSize: 32 },
	quizCardTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.semiBold, color: COLORS.textPrimary },
	quizCardArrow: { fontSize: 24, color: COLORS.primary },

	// Quiz view
	quizContainer: { padding: SPACING.md, paddingBottom: SPACING.huge },
	quizHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
	quizHeaderUser: { color: COLORS.textSecondary, fontWeight: '500' },
	quizTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
	quizInstruction: { color: COLORS.textMuted, fontSize: 13, marginBottom: 20 },

	// Table DnD
	tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
	thText: { color: COLORS.primaryLight, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
	tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border + '30' },
	tableRowAlt: { backgroundColor: COLORS.white + '05' },

	draggableVocab: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.surface,
		padding: 8,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: COLORS.primary + '40',
		...SHADOWS.sm
	},
	vocabNumBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
	vocabNumText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
	vocabText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '500' },

	descText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },

	colDrop: { width: 80, alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end' },
	dropZone: { width: 44, height: 44, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.primary + '60', backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
	dropZoneFilled: { borderStyle: 'solid', borderColor: COLORS.success, backgroundColor: COLORS.success + '15' },
	dropZoneText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
	clearBtn: { padding: 4, marginLeft: 4 },
	clearBtnText: { color: COLORS.error, fontSize: 16 },

	submitButton: { marginTop: 30 },

	// Result view
	resultContainer: { padding: 24, alignItems: 'center' },
	resultEmoji: { fontSize: 64, marginBottom: 16 },
	resultTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.textPrimary },
	resultSubtitle: { fontSize: 18, color: COLORS.textSecondary, marginBottom: 24 },
	scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: COLORS.surface },
	scorePercentage: { fontSize: 28, fontWeight: 'bold' },
	detailCard: { width: '100%' },
	detailTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 16 },
	detailRow: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 16 },
	detailHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
	detailNumber: { color: COLORS.textMuted, fontSize: 12 },
	detailAnswer: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500', marginBottom: 4 },
	detailTermRow: { flexDirection: 'row', marginTop: 2 },
	detailTermLabel: { fontSize: 13, color: COLORS.textSecondary, marginRight: 6 },
	detailTermValue: { fontSize: 13, fontWeight: 'bold' },
	detailCorrection: { fontSize: 12, color: COLORS.error, marginTop: 4, fontStyle: 'italic' },
	buttonRow: { flexDirection: 'row', width: '100%', marginTop: 24 },
});

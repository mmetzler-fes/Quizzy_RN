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
function DraggableTerm({ term, index, onDrag, onDragEnd, disabled }) {
	const pan = useRef(new Animated.ValueXY()).current;
	const scale = useRef(new Animated.Value(1)).current;
	const zIndex = useRef(new Animated.Value(1)).current;

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => !disabled,
			onMoveShouldSetPanResponder: () => !disabled,
			onPanResponderGrant: () => {
				zIndex.setValue(1000);
				Animated.spring(scale, { toValue: 1.1, useNativeDriver: false }).start();
			},
			onPanResponderMove: (e, gesture) => {
				Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(e, gesture);
				onDrag(gesture.moveX, gesture.moveY);
			},
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
			<Text style={styles.vocabText} numberOfLines={1}>{term}</Text>
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
	const [activeHoverZone, setActiveHoverZone] = useState(null);

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const dropRefs = useRef({});

	useEffect(() => { loadQuizNames(); }, []);

	useEffect(() => {
		Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
	}, [selectedQuiz, submitted]);

	const loadQuizNames = async () => {
		try {
			const names = await getQuizNames();
			setQuizNames(names);
			if (names.length > 0) selectQuiz(names[0]);
		} catch (error) { console.error(error); } finally { setLoading(false); }
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
		} catch (error) { console.error(error); } finally { setLoading(false); }
	};

	const updateDropZonesMeasurements = () => {
		Object.keys(dropRefs.current).forEach((idx) => {
			if (dropRefs.current[idx]) {
				dropRefs.current[idx].measure((x, y, width, height, px, py) => {
					setDropZones(prev => ({ ...prev, [idx]: { px, py, width, height } }));
				});
			}
		});
	};

	const checkCollision = (x, y) => {
		let matchedIdx = -1;
		Object.keys(dropZones).forEach((idx) => {
			const zone = dropZones[idx];
			if (x >= zone.px && x <= zone.px + zone.width && y >= zone.py && y <= zone.py + zone.height) {
				matchedIdx = parseInt(idx);
			}
		});
		return matchedIdx;
	};

	const handleDrag = (x, y) => {
		setActiveHoverZone(checkCollision(x, y));
	};

	const handleDragEnd = (termIdx, x, y) => {
		const matchedIdx = checkCollision(x, y);
		if (matchedIdx !== -1) {
			setUserAnswers((prev) => ({ ...prev, [matchedIdx]: termIdx }));
		}
		setActiveHoverZone(null);
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
		try { await saveQuizResult(username, selectedQuiz, correct, quizData.length, details); } catch (e) { console.error(e); }
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
						<Text style={styles.resultEmoji}>{isPerfect ? '🏆' : isGood ? '👏' : '💪'}</Text>
						<Text style={styles.resultTitle}>{isPerfect ? 'Perfekt!' : isGood ? 'Gut gemacht!' : 'Weiter üben!'}</Text>
						<Text style={styles.resultSubtitle}>{username}, du hast {score} von {quizData.length} richtig!</Text>

						<View style={[styles.scoreCircle, { borderColor: isPerfect ? COLORS.success : isGood ? COLORS.accent : COLORS.error }]}>
							<Text style={[styles.scorePercentage, { color: isPerfect ? COLORS.success : isGood ? COLORS.accent : COLORS.error }]}>{percentage}%</Text>
						</View>

						<Card style={styles.detailCard}>
							<Text style={styles.detailTitle}>📋 Übersicht</Text>
							{shuffledAnswers.map((item, idx) => {
								const userInputIdx = userAnswers[idx];
								const correctIndex = quizData.findIndex(q => q.id === item.id);
								const isCorrect = userInputIdx === correctIndex;

								return (
									<View key={idx} style={[styles.detailRow, { borderLeftColor: isCorrect ? COLORS.success : COLORS.error }]}>
										<Text style={styles.detailAnswer}>{item.answer}</Text>
										<View style={styles.detailTermRow}>
											<Text style={styles.detailTermLabel}>Deine Wahl:</Text>
											<Text style={[styles.detailTermValue, { color: isCorrect ? COLORS.success : COLORS.error }]}>({userInputIdx + 1}) {quizData[userInputIdx]?.query}</Text>
										</View>
										{!isCorrect && <Text style={styles.detailCorrection}>Richtig wäre: ({correctIndex + 1}) {quizData[correctIndex].query}</Text>}
									</View>
								);
							})}
						</Card>

						<View style={styles.buttonRow}>
							<GradientButton
								title="🔄  Nochmal"
								onPress={() => selectQuiz(selectedQuiz)}
								variant="primary"
								style={{ flex: 1 }}
							/>
							<GradientButton
								title="📋  Anderes Quiz"
								onPress={() => { setSelectedQuiz(null); setSubmitted(false); }}
								variant="accent"
								style={{ flex: 1 }}
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
								<Text style={[styles.quizCardTitle, { flex: 1, marginLeft: 16 }]}>{name}</Text>
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
			<ScrollView
				contentContainerStyle={styles.quizContainer}
				onScroll={updateDropZonesMeasurements}
				scrollEventThrottle={16}
			>
				<Animated.View style={{ opacity: fadeAnim }}>
					{/* Header */}
					<View style={styles.quizHeader}>
						<Badge text={selectedQuiz} variant="primary" />
						<Text style={styles.quizHeaderUser}>👤 {username}</Text>
					</View>

					<Text style={styles.quizTitle}>Zuordnungs-Quiz</Text>
					<Text style={styles.quizInstruction}>Ziehe die Begriffe von links auf die Zielfelder ganz rechts.</Text>

					{/* Table Headers */}
					<View style={styles.tableHeader}>
						<Text style={[styles.thText, { width: 30 }]}>#</Text>
						<Text style={[styles.thText, { width: 100 }]}>Begriff</Text>
						<Text style={[styles.thText, { flex: 1, marginLeft: 10 }]}>Beschreibung</Text>
						<Text style={[styles.thText, { width: 100, textAlign: 'center' }]}>Ziel (?)</Text>
					</View>

					{/* Table Rows */}
					{shuffledAnswers.map((item, idx) => (
						<View key={idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
							{/* Index */}
							<Text style={[styles.detailNumber, { width: 30, textAlign: 'center' }]}>{idx + 1}</Text>

							{/* Draggable Term Section (Left) */}
							<View style={{ width: 100 }}>
								{quizData[idx] && (
									<DraggableTerm
										term={quizData[idx].query}
										index={idx}
										onDrag={handleDrag}
										onDragEnd={handleDragEnd}
										disabled={submitted}
									/>
								)}
							</View>

							{/* Description Section (Middle) */}
							<View style={{ flex: 1, paddingHorizontal: 12 }}>
								<Text style={styles.descText}>{item.answer}</Text>
							</View>

							{/* Drop Zone Section (Right) */}
							<View style={{ width: 100, alignItems: 'center', justifyContent: 'center' }}>
								<View
									onLayout={updateDropZonesMeasurements}
									ref={(ref) => { dropRefs.current[idx] = ref; }}
									style={[
										styles.dropZone,
										userAnswers[idx] !== undefined && styles.dropZoneFilled,
										activeHoverZone === idx && styles.dropZoneHover
									]}
								>
									<Text style={styles.dropZoneText}>
										{userAnswers[idx] !== undefined ? (userAnswers[idx] + 1) : '?'}
									</Text>
								</View>
								{userAnswers[idx] !== undefined && (
									<TouchableOpacity onPress={() => { let n = { ...userAnswers }; delete n[idx]; setUserAnswers(n); }} style={styles.clearBtn}>
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
	selectContainer: { padding: 24, paddingTop: 40 },
	selectTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 24 },
	quizCard: { marginBottom: 12 },
	quizCardContent: { flexDirection: 'row', alignItems: 'center' },
	quizCardEmoji: { fontSize: 24 },
	quizCardTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
	quizCardArrow: { fontSize: 20, color: COLORS.primary },

	// Quiz view
	quizContainer: { padding: 12, paddingBottom: 60 },
	quizHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
	quizHeaderUser: { color: COLORS.textSecondary, fontWeight: '500' },
	quizTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
	quizInstruction: { color: COLORS.textMuted, fontSize: 12, marginBottom: 16 },

	// Table DnD
	tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
	thText: { color: COLORS.primaryLight, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
	tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border + '20' },
	tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.03)' },

	draggableVocab: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 6, borderRadius: 6, borderWidth: 1, borderColor: COLORS.primary + '30', ...SHADOWS.sm },
	vocabNumBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
	vocabNumText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
	vocabText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '500' },

	descText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 16 },

	dropZone: { width: 56, height: 56, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.primary + '40', backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
	dropZoneFilled: { borderStyle: 'solid', borderColor: COLORS.success, backgroundColor: COLORS.success + '10' },
	dropZoneHover: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '20', transform: [{ scale: 1.1 }] },
	dropZoneText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold' },
	clearBtn: { padding: 4, marginTop: 4 },
	clearBtnText: { color: COLORS.error, fontSize: 14 },

	submitButton: { marginTop: 24 },

	// Result view
	resultContainer: { padding: 24, alignItems: 'center' },
	resultEmoji: { fontSize: 56, marginBottom: 12 },
	resultTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary },
	resultSubtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 20 },
	scoreCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: COLORS.surface },
	scorePercentage: { fontSize: 24, fontWeight: 'bold' },
	detailCard: { width: '100%' },
	detailTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 12 },
	detailRow: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 12 },
	detailNumber: { color: COLORS.textMuted, fontSize: 11 },
	detailAnswer: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
	detailTermRow: { flexDirection: 'row', marginTop: 2 },
	detailTermLabel: { fontSize: 12, color: COLORS.textSecondary, marginRight: 4 },
	detailTermValue: { fontSize: 12, fontWeight: 'bold' },
	detailCorrection: { fontSize: 11, color: COLORS.error, marginTop: 2 },
	buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
});

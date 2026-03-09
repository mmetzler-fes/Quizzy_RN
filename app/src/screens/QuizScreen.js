import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	Animated,
	Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../styles/theme';
import { GradientButton, Card, LoadingView, EmptyState, Badge } from '../components/UI';
import { getQuizByName, getQuizNames, saveQuizResult } from '../database/database';
import { getSelectedTopics } from './QuizManageScreen';

function shuffle(array) {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

// ─── constants ───────────────────────────────────────────
const COL_TERM_W = 140; // left: term chips
const COL_DROP_W = 150; // center: drop zones
const ROW_MIN_H = 64;

// ─── QuizScreen ──────────────────────────────────────────
//
// Data model:
//   shuffledTerms  = quizData shuffled independently → LEFT  (only .query shown)
//   shuffledDescs  = quizData shuffled independently → RIGHT (only .answer shown)
//   Drop zones live in the MIDDLE column, indexed by descIdx (0…N-1)
//
//   userAnswers: { descIdx → termIdx }
//     "For the description at row descIdx, the user placed term chip termIdx"
//   Correct when: shuffledTerms[termIdx].id === shuffledDescs[descIdx].id
//
export default function QuizScreen({ route }) {
	const username = route?.params?.username || 'Spieler';

	const [quizNames, setQuizNames] = useState([]);
	const [selectedQuiz, setSelectedQuiz] = useState(null);
	const [quizData, setQuizData] = useState([]);
	const [shuffledTerms, setShuffledTerms] = useState([]); // left column
	const [shuffledDescs, setShuffledDescs] = useState([]); // right column
	const [userAnswers, setUserAnswers] = useState({});  // descIdx → termIdx
	const [submitted, setSubmitted] = useState(false);
	const [score, setScore] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeHover, setActiveHover] = useState(null);
	const [draggingTermIdx, setDraggingTermIdx] = useState(null); // termIdx in shuffledTerms

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const ghostX = useRef(new Animated.Value(0)).current;
	const ghostY = useRef(new Animated.Value(0)).current;
	const rootRef = useRef(null);
	const rootOrigin = useRef({ x: 0, y: 0 });
	const isDragging = useRef(false);
	const dragTermIdx = useRef(null);
	const dropRefs = useRef({}); // descIdx → DOM element

	// ── data ─────────────────────────────────────────────
	// Reload whenever this tab gets focus → picks up topic selection changes
	useFocusEffect(
		useCallback(() => { loadQuizNames(); }, [])
	);
	useEffect(() => {
		Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
	}, [selectedQuiz, submitted]);

	const loadQuizNames = async () => {
		try {
			const allNames = await getQuizNames();
			const selectedTopics = await getSelectedTopics();
			// Filter to selected topics; if none saved or all deselected fall back to all
			const names = (selectedTopics && selectedTopics.length > 0)
				? allNames.filter(n => selectedTopics.includes(n))
				: allNames;
			setQuizNames(names);
			if (names.length > 0) selectQuiz(names[0]);
		} catch (e) { console.error(e); } finally { setLoading(false); }
	};

	const selectQuiz = async (name) => {
		setLoading(true);
		try {
			const data = await getQuizByName(name);
			setQuizData(data);
			setShuffledTerms(shuffle(data));  // independent shuffle for left column
			setShuffledDescs(shuffle(data));  // independent shuffle for right column
			setSelectedQuiz(name);
			setUserAnswers({});
			setSubmitted(false);
			setScore(null);
			fadeAnim.setValue(0);
		} catch (e) { console.error(e); } finally { setLoading(false); }
	};

	// ── mouse drag handlers ───────────────────────────────
	useEffect(() => {
		const hitTest = (cx, cy) => {
			for (const [key, el] of Object.entries(dropRefs.current)) {
				if (!el) continue;
				const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
				if (!r) continue;
				if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom)
					return parseInt(key);
			}
			return -1;
		};

		const onMouseMove = (e) => {
			if (!isDragging.current) return;
			const co = rootOrigin.current;
			ghostX.setValue(e.clientX - co.x - COL_TERM_W / 2);
			ghostY.setValue(e.clientY - co.y - 20);
			const hit = hitTest(e.clientX, e.clientY);
			setActiveHover(hit >= 0 ? hit : null);
		};

		const onMouseUp = (e) => {
			if (!isDragging.current) return;
			const hit = hitTest(e.clientX, e.clientY);
			const tIdx = dragTermIdx.current;
			if (hit !== -1 && tIdx !== null) {
				setUserAnswers(prev => {
					const next = {};
					Object.entries(prev).forEach(([k, v]) => { if (v !== tIdx) next[k] = v; });
					next[hit] = tIdx;
					return next;
				});
			}
			isDragging.current = false;
			dragTermIdx.current = null;
			setDraggingTermIdx(null);
			setActiveHover(null);
		};

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
		return () => {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
		};
	}, []);

	const onRootLayout = () => {
		if (rootRef.current) {
			rootRef.current.measureInWindow((x, y) => { rootOrigin.current = { x, y }; });
		}
	};

	const handleTermMouseDown = (termIdx, e) => {
		if (submitted) return;
		e.preventDefault();
		if (rootRef.current)
			rootRef.current.measureInWindow((x, y) => { rootOrigin.current = { x, y }; });
		const co = rootOrigin.current;
		ghostX.setValue(e.clientX - co.x - COL_TERM_W / 2);
		ghostY.setValue(e.clientY - co.y - 20);
		isDragging.current = true;
		dragTermIdx.current = termIdx;
		setDraggingTermIdx(termIdx);
	};

	// ── submit ────────────────────────────────────────────
	const handleSubmit = async () => {
		const allFilled = shuffledDescs.every((_, idx) => userAnswers[idx] !== undefined);
		if (!allFilled) {
			Alert.alert('Nicht komplett', 'Bitte ziehe alle Begriffe auf die Fragezeichen.');
			return;
		}
		let correct = 0;
		const details = [];
		shuffledDescs.forEach((descItem, descIdx) => {
			const termIdx = userAnswers[descIdx];
			const termItem = shuffledTerms[termIdx];
			const ok = termItem?.id === descItem.id;
			if (ok) correct++;
			details.push({
				query: termItem?.query ?? '?',
				description: descItem.answer,
				userAnswer: termItem?.query ?? '?',
				correctAnswer: descItem.query,
				isCorrect: ok,
			});
		});
		setScore(correct);
		setSubmitted(true);
		fadeAnim.setValue(0);
		try { await saveQuizResult(username, selectedQuiz, correct, quizData.length, details); }
		catch (e) { console.error(e); }
	};

	// termIdx values already sitting in a drop zone → dim their chip
	const placedTermIndices = new Set(Object.values(userAnswers));

	// ── guards ────────────────────────────────────────────
	if (loading) return <LoadingView message="Quiz wird geladen..." />;
	if (quizNames.length === 0) {
		return (
			<View style={styles.container}>
				<EmptyState icon="📝" title="Keine Quizze vorhanden"
					subtitle="Füge zuerst Quiz-Fragen im Verwaltungsbereich hinzu." />
			</View>
		);
	}

	// ── result view ───────────────────────────────────────
	if (submitted) {
		const pct = Math.round((score / quizData.length) * 100);
		const isPerfect = score === quizData.length;
		const isGood = pct >= 70;
		return (
			<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
				<ScrollView contentContainerStyle={styles.resultContainer}>
					<Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
						<Text style={styles.resultEmoji}>{isPerfect ? '🏆' : isGood ? '👏' : '💪'}</Text>
						<Text style={styles.resultTitle}>{isPerfect ? 'Perfekt!' : isGood ? 'Gut gemacht!' : 'Weiter üben!'}</Text>
						<Text style={styles.resultSubtitle}>{username}, du hast {score} von {quizData.length} richtig!</Text>
						<View style={[styles.scoreCircle, { borderColor: isPerfect ? COLORS.success : isGood ? COLORS.accent : COLORS.error }]}>
							<Text style={[styles.scorePercentage, { color: isPerfect ? COLORS.success : isGood ? COLORS.accent : COLORS.error }]}>{pct}%</Text>
						</View>
						<Card style={styles.detailCard}>
							<Text style={styles.detailTitle}>📋 Übersicht</Text>
							{shuffledDescs.map((descItem, descIdx) => {
								const termIdx = userAnswers[descIdx];
								const termItem = shuffledTerms[termIdx];
								const ok = termItem?.id === descItem.id;
								return (
									<View key={descIdx} style={[styles.detailRow, { borderLeftColor: ok ? COLORS.success : COLORS.error }]}>
										<Text style={styles.detailAnswer}>{descItem.answer}</Text>
										<View style={styles.detailTermRow}>
											<Text style={styles.detailTermLabel}>Deine Wahl:</Text>
											<Text style={[styles.detailTermValue, { color: ok ? COLORS.success : COLORS.error }]}>
												{termItem?.query ?? '?'}
											</Text>
										</View>
										{!ok && <Text style={styles.detailCorrection}>Richtig wäre: {descItem.query}</Text>}
									</View>
								);
							})}
						</Card>
						<View style={styles.buttonRow}>
							<GradientButton title="🔄  Nochmal" onPress={() => selectQuiz(selectedQuiz)} variant="primary" style={{ flex: 1 }} />
							<GradientButton title="📋  Anderes Quiz" onPress={() => { setSelectedQuiz(null); setSubmitted(false); }} variant="accent" style={{ flex: 1 }} />
						</View>
					</Animated.View>
				</ScrollView>
			</LinearGradient>
		);
	}

	// ── quiz select view ──────────────────────────────────
	if (!selectedQuiz) {
		return (
			<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
				<ScrollView contentContainerStyle={styles.selectContainer}>
					<Text style={styles.selectTitle}>Quiz auswählen</Text>
					{quizNames.map(name => (
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

	// ── quiz play view ────────────────────────────────────
	//
	// Per row:  [shuffledTerms[i].query chip]  [Drop Zone (center)]  [shuffledDescs[i].answer]
	//
	return (
		<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
			<View ref={rootRef} style={{ flex: 1 }} onLayout={onRootLayout}>
				<Animated.View style={{ flex: 1, opacity: fadeAnim }}>

					{/* Header */}
					<View style={styles.header}>
						<Badge text={selectedQuiz} variant="primary" />
						<Text style={styles.headerUser}>👤 {username}</Text>
					</View>
					<Text style={styles.quizTitle}>Zuordnungs-Quiz</Text>
					<Text style={styles.quizInstruction}>
						Ziehe den Begriff auf das{' '}
						<Text style={{ color: COLORS.accent }}>?</Text>
						{' '}neben der passenden Beschreibung.
					</Text>

					{/* Column headers */}
					<View style={styles.colHeaders}>
						<View style={{ width: COL_TERM_W }}>
							<Text style={styles.colHeaderText}>BEGRIFFE</Text>
						</View>
						<View style={{ width: COL_DROP_W, alignItems: 'center' }}>
							<Text style={styles.colHeaderText}>ZUORDNUNG</Text>
						</View>
						<View style={{ flex: 1, paddingHorizontal: 8 }}>
							<Text style={styles.colHeaderText}>BESCHREIBUNG</Text>
						</View>
					</View>

					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ paddingBottom: 60 }}
						showsVerticalScrollIndicator={false}
					>
						{shuffledDescs.map((descItem, descIdx) => {
							const termForRow = shuffledTerms[descIdx];     // left chip (shuffled)
							const isBeingDragged = draggingTermIdx === descIdx;
							const isPlaced = placedTermIndices.has(descIdx); // this chip is elsewhere
							const placed = userAnswers[descIdx];       // termIdx in THIS drop zone
							return (
								<View key={descIdx} style={[styles.row, descIdx % 2 === 0 && styles.rowAlt]}>

									{/* LEFT: shuffled term chip */}
									<View
										style={[
											styles.termChip,
											isBeingDragged && styles.termChipActive,
											isPlaced && styles.termChipPlaced,
										]}
										onMouseDown={(e) => handleTermMouseDown(descIdx, e)}
									>
										<View style={styles.chipBadge}>
											<Text style={styles.chipBadgeText}>{descIdx + 1}</Text>
										</View>
										<Text style={styles.chipLabel} numberOfLines={2}>
											{termForRow?.query}
										</Text>
									</View>

									{/* CENTER: drop zone */}
									<View style={styles.dropCol}>
										<View
											ref={el => { dropRefs.current[descIdx] = el; }}
											style={[
												styles.dropZone,
												placed !== undefined && styles.dropZoneFilled,
												activeHover === descIdx && styles.dropZoneHover,
											]}
										>
											{placed !== undefined ? (
												<View style={styles.dropZoneContent}>
													<View style={styles.dropZoneBadge}>
														<Text style={styles.dropZoneBadgeText}>{placed + 1}</Text>
													</View>
													<Text style={styles.dropZoneFilledText} numberOfLines={2}>
														{shuffledTerms[placed]?.query}
													</Text>
													<TouchableOpacity
														onPress={() => setUserAnswers(prev => { const n = { ...prev }; delete n[descIdx]; return n; })}
														style={styles.clearBtn}
													>
														<Text style={styles.clearBtnText}>✕</Text>
													</TouchableOpacity>
												</View>
											) : (
												<Text style={styles.dropZoneQMark}>?</Text>
											)}
										</View>
									</View>

									{/* RIGHT: shuffled description */}
									<View style={{ flex: 1, paddingHorizontal: 12, justifyContent: 'center' }}>
										<Text style={styles.descText}>{descItem.answer}</Text>
									</View>

								</View>
							);
						})}

						<GradientButton
							title="✅  Einreichen"
							onPress={handleSubmit}
							variant="success"
							style={styles.submitButton}
						/>
					</ScrollView>

					{/* Ghost chip */}
					{draggingTermIdx !== null && (
						<Animated.View
							pointerEvents="none"
							style={[
								styles.termChip,
								styles.termChipGhost,
								{ position: 'absolute', left: ghostX, top: ghostY },
							]}
						>
							<View style={styles.chipBadge}>
								<Text style={styles.chipBadgeText}>{draggingTermIdx + 1}</Text>
							</View>
							<Text style={styles.chipLabel} numberOfLines={1}>
								{shuffledTerms[draggingTermIdx]?.query}
							</Text>
						</Animated.View>
					)}

				</Animated.View>
			</View>
		</LinearGradient>
	);
}

// ─── styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
	container: { flex: 1 },

	header: {
		flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
		paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
	},
	headerUser: { color: COLORS.textSecondary, fontWeight: '500', fontSize: 12 },
	quizTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, paddingHorizontal: 16, marginTop: 4 },
	quizInstruction: { color: COLORS.textMuted, fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },

	colHeaders: {
		flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6,
		borderBottomWidth: 1, borderBottomColor: COLORS.border,
		backgroundColor: 'rgba(255,255,255,0.04)',
	},
	colHeaderText: {
		color: COLORS.primaryLight, fontSize: 9, fontWeight: 'bold',
		letterSpacing: 1, textTransform: 'uppercase',
	},

	// rows
	row: {
		flexDirection: 'row', alignItems: 'center', minHeight: ROW_MIN_H,
		paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border + '20',
	},
	rowAlt: { backgroundColor: 'rgba(255,255,255,0.025)' },

	// term chip (left)
	termChip: {
		width: COL_TERM_W - 16,
		flexDirection: 'row', alignItems: 'center',
		backgroundColor: COLORS.surface,
		paddingVertical: 8, paddingHorizontal: 8,
		borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.primary + '55',
		cursor: 'grab',
		...SHADOWS.sm,
	},
	termChipActive: {
		borderColor: COLORS.accent,
		backgroundColor: COLORS.accent + '15',
		cursor: 'grabbing',
	},
	termChipPlaced: {
		opacity: 0.4,
		borderColor: COLORS.success + '60',
	},
	termChipGhost: {
		zIndex: 9999, opacity: 0.92,
		borderColor: COLORS.accent,
		backgroundColor: COLORS.surface,
		cursor: 'grabbing',
		width: COL_TERM_W,
		...SHADOWS.md,
	},
	chipBadge: {
		width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary,
		alignItems: 'center', justifyContent: 'center', marginRight: 6, flexShrink: 0,
	},
	chipBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
	chipLabel: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '600', flex: 1 },

	// drop zone column (center)
	dropCol: {
		width: COL_DROP_W,
		alignItems: 'center', justifyContent: 'center',
		paddingVertical: 6, paddingHorizontal: 4,
	},
	dropZone: {
		width: COL_DROP_W - 16, minHeight: 50, borderRadius: 10, borderWidth: 2,
		borderStyle: 'dashed', borderColor: COLORS.primary + '50',
		backgroundColor: COLORS.background,
		alignItems: 'center', justifyContent: 'center',
		paddingHorizontal: 6, paddingVertical: 4,
	},
	dropZoneFilled: {
		borderStyle: 'solid', borderColor: COLORS.success,
		backgroundColor: COLORS.success + '12',
	},
	dropZoneHover: {
		borderColor: COLORS.accent, backgroundColor: COLORS.accent + '25',
		transform: [{ scale: 1.04 }],
	},
	dropZoneQMark: { color: COLORS.primary + '80', fontSize: 22, fontWeight: 'bold' },
	dropZoneContent: { flexDirection: 'row', alignItems: 'center', width: '100%' },
	dropZoneBadge: {
		width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.success,
		alignItems: 'center', justifyContent: 'center', marginRight: 5, flexShrink: 0,
	},
	dropZoneBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
	dropZoneFilledText: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '600', flex: 1 },
	clearBtn: { paddingLeft: 4, flexShrink: 0 },
	clearBtnText: { color: COLORS.error, fontSize: 14 },

	descText: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 16 },

	submitButton: { marginTop: 20, marginHorizontal: 16 },

	// quiz select
	selectContainer: { padding: 24, paddingTop: 40 },
	selectTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 24 },
	quizCard: { marginBottom: 12 },
	quizCardContent: { flexDirection: 'row', alignItems: 'center' },
	quizCardEmoji: { fontSize: 24 },
	quizCardTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
	quizCardArrow: { fontSize: 20, color: COLORS.primary },

	// result
	resultContainer: { padding: 24, alignItems: 'center' },
	resultEmoji: { fontSize: 56, marginBottom: 12 },
	resultTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary },
	resultSubtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 20 },
	scoreCircle: {
		width: 90, height: 90, borderRadius: 45, borderWidth: 3,
		alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: COLORS.surface,
	},
	scorePercentage: { fontSize: 24, fontWeight: 'bold' },
	detailCard: { width: '100%' },
	detailTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 12 },
	detailRow: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 12 },
	detailAnswer: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
	detailTermRow: { flexDirection: 'row', marginTop: 2 },
	detailTermLabel: { fontSize: 12, color: COLORS.textSecondary, marginRight: 4 },
	detailTermValue: { fontSize: 12, fontWeight: 'bold' },
	detailCorrection: { fontSize: 11, color: COLORS.error, marginTop: 2 },
	buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
});

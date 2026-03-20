import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	Alert,
	Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { GradientButton, Card, LoadingView, EmptyState, Badge } from '../components/UI';
import { getQuizByName, getQuizNames, saveQuizResult, getSelectedTopics, getExamMode, getTeacherTopics } from '../database/database';

function shuffle(array) {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

// ─── constants ───────────────────────────────────────────
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
	const { colors, isDark } = useTheme();
	const styles = useStyles(colors);
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
	const [selectedTermIdx, setSelectedTermIdx] = useState(null);
	const [isExamMode, setIsExamMode] = useState(false);
	const [currentExamTopicIndex, setCurrentExamTopicIndex] = useState(0);
	const [examFinished, setExamFinished] = useState(false);

	const [dynTermWidth, setDynTermWidth] = useState(140);
	const [dynDropWidth, setDynDropWidth] = useState(150);
	const dragTermIdx = useRef(null);
	const selectedTermIdxRef = useRef(null);
	const assignRef = useRef(null);

	// ── data ─────────────────────────────────────────────
	useFocusEffect(
		useCallback(() => { loadQuizNames(); }, [])
	);

	const loadQuizNames = async () => {
		try {
			const teacherTopics = await getTeacherTopics();
			const mode = await getExamMode();
			setIsExamMode(mode);

			let names = teacherTopics;
			if (!mode) {
				const studentTopics = await getSelectedTopics();
				if (studentTopics && studentTopics.length > 0) {
					names = teacherTopics.filter(n => studentTopics.includes(n));
				}
			}
			setQuizNames(names);

			if (mode && names.length > 0) {
				// Start exam with the first topic, ONLY if no valid quiz is selected yet
				if (!selectedQuiz || !names.includes(selectedQuiz)) {
					setCurrentExamTopicIndex(0);
					await selectQuiz(names[0]);
				}
			} else if (!selectedQuiz || !names.includes(selectedQuiz)) {
				if (names.length === 1) {
					await selectQuiz(names[0]);
				} else {
					setSelectedQuiz(null);
				}
			}
		} catch (e) {
			console.error('Error in loadQuizNames:', e);
		} finally {
			setLoading(false);
		}
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
			setSelectedTermIdx(null);
			setSubmitted(false);
			setScore(null);
			setDynTermWidth(140); // reset to min
			setDynDropWidth(150); // reset to min
		} catch (e) { console.error(e); } finally { setLoading(false); }
	};

	const onTermLayout = (e) => {
		const w = e.nativeEvent.layout.width;
		if (w > dynTermWidth) setDynTermWidth(w + 10);
	};

	const onDropZoneLayout = (e) => {
		const w = e.nativeEvent.layout.width;
		if (w > dynDropWidth) setDynDropWidth(w + 10);
	};

	const assignTermToDropZone = (termIdx, dropIdx) => {
		if (termIdx === null || termIdx === undefined || dropIdx === null || dropIdx === undefined) return;
		setUserAnswers(prev => {
			const next = {};
			Object.entries(prev).forEach(([k, v]) => { if (v !== termIdx) next[k] = v; });
			next[dropIdx] = termIdx;
			return next;
		});
	};

	// keep refs in sync so DOM callbacks always see latest values
	useEffect(() => { selectedTermIdxRef.current = selectedTermIdx; }, [selectedTermIdx]);
	useEffect(() => { assignRef.current = assignTermToDropZone; });

	const handleTermPress = (termIdx) => {
		if (submitted) return;
		setSelectedTermIdx((prev) => (prev === termIdx ? null : termIdx));
	};

	const handleDropZonePress = (descIdx) => {
		if (submitted || selectedTermIdx === null) return;
		assignTermToDropZone(selectedTermIdx, descIdx);
		setSelectedTermIdx(null);
	};

	// ── HTML5 drag-and-drop for desktop browsers (web only) ──
	// Tap-to-assign is handled by TouchableOpacity onPress (works on iPad + PC).
	// This useEffect ONLY adds mouse-based drag-and-drop as a bonus for PC.
	useEffect(() => {
		if (Platform.OS !== 'web' || !selectedQuiz || typeof document === 'undefined') return;
		// Skip on touch-only devices — they use tap-to-assign
		if ('ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches) return;

		const cleanups = [];

		document.querySelectorAll('[data-term-idx]').forEach(el => {
			const idx = parseInt(el.dataset.termIdx, 10);
			if (submitted) { el.removeAttribute('draggable'); return; }

			el.setAttribute('draggable', 'true');
			el.style.cursor = 'grab';

			const onDragStart = (e) => {
				el.style.cursor = 'grabbing';
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', String(idx));
				dragTermIdx.current = idx;
				setDraggingTermIdx(idx);
				setSelectedTermIdx(idx);
			};
			const onDragEnd = () => {
				el.style.cursor = 'grab';
				dragTermIdx.current = null;
				setDraggingTermIdx(null);
				setActiveHover(null);
			};

			el.addEventListener('dragstart', onDragStart);
			el.addEventListener('dragend', onDragEnd);
			cleanups.push(() => {
				el.removeEventListener('dragstart', onDragStart);
				el.removeEventListener('dragend', onDragEnd);
			});
		});

		document.querySelectorAll('[data-drop-idx]').forEach(el => {
			const idx = parseInt(el.dataset.dropIdx, 10);

			const onDragOver = (e) => {
				if (submitted) return;
				e.preventDefault();
				e.dataTransfer.dropEffect = 'move';
				setActiveHover(idx);
			};
			const onDragLeave = () => setActiveHover(prev => prev === idx ? null : prev);
			const onDrop = (e) => {
				if (submitted) return;
				e.preventDefault();
				let termIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
				if (Number.isNaN(termIdx)) termIdx = dragTermIdx.current;
				if (termIdx !== null && termIdx !== undefined) {
					assignRef.current(termIdx, idx);
				}
				dragTermIdx.current = null;
				setDraggingTermIdx(null);
				setSelectedTermIdx(null);
				setActiveHover(null);
			};

			el.addEventListener('dragover', onDragOver);
			el.addEventListener('dragenter', onDragOver);
			el.addEventListener('dragleave', onDragLeave);
			el.addEventListener('drop', onDrop);
			cleanups.push(() => {
				el.removeEventListener('dragover', onDragOver);
				el.removeEventListener('dragenter', onDragOver);
				el.removeEventListener('dragleave', onDragLeave);
				el.removeEventListener('drop', onDrop);
			});
		});

		return () => cleanups.forEach(fn => fn());
	}, [shuffledTerms, shuffledDescs, submitted, selectedQuiz]);

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
		try { await saveQuizResult(username, selectedQuiz, correct, quizData.length, details); }
		catch (e) { console.error(e); }
	};

	// termIdx values already sitting in a drop zone → dim their chip
	const placedTermIndices = new Set(Object.values(userAnswers));

	// ── guards ────────────────────────────────────────────
	if (examFinished) {
		return (
			<LinearGradient colors={isDark ? [colors.background, '#1a1040'] : [colors.background, colors.background] } style={styles.container}>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<Text style={{ fontSize: 64, marginBottom: 20 }}>🏁</Text>
					<Text style={{ fontSize: 24, color: colors.textPrimary, fontWeight: 'bold' }}>Prüfung beendet!</Text>
					<Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 10 }}>Alle Themen wurden durchlaufen.</Text>
				</View>
			</LinearGradient>
		);
	}
	if (loading) return <LoadingView message="Quiz wird geladen..." />;
	if (quizNames.length === 0) {
		return (
			<View style={styles.container}>
				<EmptyState icon="📝" title="Keine Quizze vorhanden"
					subtitle={isExamMode
						? "Der Lehrer muss im Lehrer-Bereich mindestens ein Thema für die Prüfung aktivieren."
						: "Füge zuerst Quiz-Fragen im Verwaltungsbereich hinzu."
					} />
			</View>
		);
	}

	// ── result view ───────────────────────────────────────
	if (submitted) {
		const pct = Math.round((score / quizData.length) * 100);
		const isPerfect = score === quizData.length;
		const isGood = pct >= 70;
		return (
			<LinearGradient colors={isDark ? [colors.background, '#1a1040'] : [colors.background, colors.background] } style={styles.container}>
				<ScrollView contentContainerStyle={styles.resultContainer}>
					<View style={{ alignItems: 'center' }}>
						<Text style={styles.resultEmoji}>{isPerfect ? '🏆' : isGood ? '👏' : '💪'}</Text>
						<Text style={styles.resultTitle}>{isPerfect ? 'Perfekt!' : isGood ? 'Gut gemacht!' : 'Weiter üben!'}</Text>
						<Text style={styles.resultSubtitle}>{username}, du hast {score} von {quizData.length} richtig!</Text>
						<View style={[styles.scoreCircle, { borderColor: isPerfect ? colors.success : isGood ? colors.accent : colors.error }]}>
							<Text style={[styles.scorePercentage, { color: isPerfect ? colors.success : isGood ? colors.accent : colors.error }]}>{pct}%</Text>
						</View>
						<Card style={styles.detailCard}>
							<Text style={styles.detailTitle}>📋 Übersicht</Text>
							{shuffledDescs.map((descItem, descIdx) => {
								const termIdx = userAnswers[descIdx];
								const termItem = shuffledTerms[termIdx];
								const ok = termItem?.id === descItem.id;
								return (
									<View key={descIdx} style={[styles.detailRow, { borderLeftColor: ok ? colors.success : colors.error }]}>
										<Text style={styles.detailAnswer}>{descItem.answer}</Text>
										<View style={styles.detailTermRow}>
											<Text style={styles.detailTermLabel}>Deine Wahl:</Text>
											<Text style={[styles.detailTermValue, { color: ok ? colors.success : colors.error }]}>
												{termItem?.query ?? '?'}
											</Text>
										</View>
										{!ok && <Text style={styles.detailCorrection}>Richtig wäre: {descItem.query}</Text>}
									</View>
								);
							})}
						</Card>
						{isExamMode ? (
							<View style={styles.buttonRow}>
								{currentExamTopicIndex < quizNames.length - 1 ? (
									<GradientButton title="Nächstes Thema →" onPress={() => {
										const nextIdx = currentExamTopicIndex + 1;
										setCurrentExamTopicIndex(nextIdx);
										selectQuiz(quizNames[nextIdx]);
									}} variant="primary" style={{ flex: 1 }} />
								) : (
									<GradientButton title="🏁 Prüfung beenden" onPress={() => setExamFinished(true)} variant="success" style={{ flex: 1 }} />
								)}
							</View>
						) : (
							<View style={styles.buttonRow}>
								<GradientButton title="🔄  Nochmal" onPress={() => selectQuiz(selectedQuiz)} variant="primary" style={{ flex: 1 }} />
								<GradientButton title="📋  Anderes Quiz" onPress={() => { setSelectedQuiz(null); setSubmitted(false); }} variant="accent" style={{ flex: 1 }} />
							</View>
						)}
					</View>
				</ScrollView>
			</LinearGradient>
		);
	}

	// ── quiz select view ──────────────────────────────────
	if (!selectedQuiz) {
		return (
			<LinearGradient colors={isDark ? [colors.background, '#1a1040'] : [colors.background, colors.background] } style={styles.container}>
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
		<LinearGradient colors={isDark ? [colors.background, '#1a1040'] : [colors.background, colors.background] } style={styles.container}>
			<View style={{ flex: 1 }}>
				<View style={{ flex: 1 }}>

					{/* Header */}
					<View style={styles.header}>
						<Badge text={selectedQuiz} variant="primary" />
						<Text style={styles.headerUser}>👤 {username}</Text>
					</View>
					<Text style={styles.quizTitle}>Zuordnungs-Quiz</Text>
					<Text style={styles.quizInstruction}>
						Ziehe den Begriff auf das{' '}
						<Text style={{ color: colors.accent }}>?</Text>
						{' '}neben der passenden Beschreibung — oder tippe Begriff, dann Zielzone.
					</Text>

					{/* Column headers */}
					<View style={styles.colHeaders}>
						<View style={{ width: dynTermWidth }}>
							<Text style={styles.colHeaderText}>BEGRIFFE</Text>
						</View>
						<View style={{ width: dynDropWidth, alignItems: 'center' }}>
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
							const isSelected = selectedTermIdx === descIdx;
							const isPlaced = placedTermIndices.has(descIdx); // this chip is elsewhere
							const placed = userAnswers[descIdx];       // termIdx in THIS drop zone
							return (
								<View key={descIdx} style={[styles.row, descIdx % 2 === 0 && styles.rowAlt]}>

									{/* LEFT: term chip — TouchableOpacity for reliable tap on iPad */}
									<TouchableOpacity
										activeOpacity={0.7}
										onPress={() => handleTermPress(descIdx)}
										dataSet={{ termIdx: String(descIdx) }}
										style={[
											styles.termChip,
											{ width: dynTermWidth - 16 },
											isBeingDragged && styles.termChipActive,
											isSelected && styles.termChipSelected,
											isPlaced && styles.termChipPlaced,
										]}
										onLayout={onTermLayout}
									>
										<View style={styles.chipBadge}>
											<Text style={styles.chipBadgeText}>{descIdx + 1}</Text>
										</View>
										<Text style={styles.chipLabel} numberOfLines={2}>
											{termForRow?.query}
										</Text>
									</TouchableOpacity>

									{/* CENTER: drop zone — TouchableOpacity for reliable tap on iPad */}
									<View style={[styles.dropCol, { width: dynDropWidth }]}>
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={() => handleDropZonePress(descIdx)}
											dataSet={{ dropIdx: String(descIdx) }}
											onLayout={onDropZoneLayout}
											style={[
												styles.dropZone,
												{ width: dynDropWidth - 16 },
												placed !== undefined && styles.dropZoneFilled,
												activeHover === descIdx && styles.dropZoneHover,
												selectedTermIdx !== null && placed === undefined && styles.dropZoneSelectable,
											]}
										>
											{placed !== undefined ? (
												<View style={styles.dropZoneContent}>
													<View style={styles.dropZoneBadge}>
														<Text style={styles.dropZoneBadgeText}>{placed + 1}</Text>
													</View>
													<Text style={[styles.dropZoneFilledText, { flex: 1 }]} numberOfLines={2}>
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
										</TouchableOpacity>
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

				</View>
			</View>
		</LinearGradient>
	);
}

// ─── styles ───────────────────────────────────────────────
function useStyles(colors) { return StyleSheet.create({
	container: { flex: 1 },

	header: {
		flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
		paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
	},
	headerUser: { color: colors.textSecondary, fontWeight: '500', fontSize: 12 },
	quizTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, paddingHorizontal: 16, marginTop: 4 },
	quizInstruction: { color: colors.textMuted, fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },

	colHeaders: {
		flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6,
		borderBottomWidth: 1, borderBottomColor: colors.border,
		backgroundColor: 'rgba(255,255,255,0.04)',
	},
	colHeaderText: {
		color: colors.primaryLight, fontSize: 9, fontWeight: 'bold',
		letterSpacing: 1, textTransform: 'uppercase',
	},

	// rows
	row: {
		flexDirection: 'row', alignItems: 'center', minHeight: ROW_MIN_H,
		paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.border + '20',
	},
	rowAlt: { backgroundColor: 'rgba(255,255,255,0.025)' },

	// term chip (left)
	termChip: {
		flexDirection: 'row', alignItems: 'center',
		backgroundColor: colors.surface,
		paddingVertical: 8, paddingHorizontal: 8,
		borderRadius: 8, borderWidth: 1.5, borderColor: colors.primary + '55',
		...(Platform.OS === 'web' ? { cursor: 'grab', userSelect: 'none' } : {}),
		...SHADOWS.sm,
	},
	termChipActive: {
		borderColor: colors.accent,
		backgroundColor: colors.accent + '15',
		...(Platform.OS === 'web' ? { cursor: 'grabbing' } : {}),
	},
	termChipSelected: {
		borderColor: colors.primary,
		backgroundColor: colors.primary + '20',
	},
	termChipPlaced: {
		opacity: 0.4,
		borderColor: colors.success + '60',
	},
	chipBadge: {
		width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary,
		alignItems: 'center', justifyContent: 'center', marginRight: 6, flexShrink: 0,
	},
	chipBadgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
	chipLabel: { color: colors.textPrimary, fontSize: 11, fontWeight: '600', flex: 1 },

	// drop zone column (center)
	dropCol: {
		alignItems: 'center', justifyContent: 'center',
		paddingVertical: 6, paddingHorizontal: 4,
	},
	dropZone: {
		minHeight: 50, borderRadius: 10, borderWidth: 2,
		borderStyle: 'dashed', borderColor: colors.primary + '50',
		backgroundColor: colors.background,
		alignItems: 'center', justifyContent: 'center',
		paddingHorizontal: 6, paddingVertical: 4,
	},
	dropZoneFilled: {
		borderStyle: 'solid', borderColor: colors.success,
		backgroundColor: colors.success + '12',
	},
	dropZoneHover: {
		borderColor: colors.accent, backgroundColor: colors.accent + '25',
		transform: [{ scale: 1.04 }],
	},
	dropZoneSelectable: {
		borderColor: colors.primary,
		backgroundColor: colors.primary + '12',
	},
	dropZoneQMark: { color: colors.primary + '80', fontSize: 22, fontWeight: 'bold' },
	dropZoneContent: { flexDirection: 'row', alignItems: 'center', width: '100%' },
	dropZoneBadge: {
		width: 20, height: 20, borderRadius: 10, backgroundColor: colors.success,
		alignItems: 'center', justifyContent: 'center', marginRight: 5, flexShrink: 0,
	},
	dropZoneBadgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
	dropZoneFilledText: { color: colors.textPrimary, fontSize: 11, fontWeight: '600', flex: 1 },
	clearBtn: { paddingLeft: 4, flexShrink: 0 },
	clearBtnText: { color: colors.error, fontSize: 14 },

	descText: { color: colors.textSecondary, fontSize: 12, lineHeight: 16 },

	submitButton: { marginTop: 20, marginHorizontal: 16 },

	// quiz select
	selectContainer: { padding: 24, paddingTop: 40 },
	selectTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 24 },
	quizCard: { marginBottom: 12 },
	quizCardContent: { flexDirection: 'row', alignItems: 'center' },
	quizCardEmoji: { fontSize: 24 },
	quizCardTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
	quizCardArrow: { fontSize: 20, color: colors.primary },

	// result
	resultContainer: { padding: 24, alignItems: 'center' },
	resultEmoji: { fontSize: 56, marginBottom: 12 },
	resultTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary },
	resultSubtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 20 },
	scoreCircle: {
		width: 90, height: 90, borderRadius: 45, borderWidth: 3,
		alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: colors.surface,
	},
	scorePercentage: { fontSize: 24, fontWeight: 'bold' },
	detailCard: { width: '100%' },
	detailTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },
	detailRow: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 12 },
	detailAnswer: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
	detailTermRow: { flexDirection: 'row', marginTop: 2 },
	detailTermLabel: { fontSize: 12, color: colors.textSecondary, marginRight: 4 },
	detailTermValue: { fontSize: 12, fontWeight: 'bold' },
	detailCorrection: { fontSize: 11, color: colors.error, marginTop: 2 },
	buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
});
}

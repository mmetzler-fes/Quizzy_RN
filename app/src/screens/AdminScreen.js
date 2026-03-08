import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	Alert,
	TextInput,
	Animated,
	Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import {
	GradientButton,
	Card,
	Badge,
	LoadingView,
	EmptyState,
	StatsCard,
	StyledInput,
} from '../components/UI';
import {
	verifyAdmin,
	getAllQuizResults,
	deleteQuizResult,
	deleteAllQuizResults,
	updateAdminPassword,
	getQuizNames,
	getQuizByName,
	addQuizItem,
	deleteQuizItem,
	updateQuizItem,
	deleteQuizByName,
} from '../database/database';

// ============================================================
// ADMIN LOGIN
// ============================================================
function AdminLogin({ onLogin, onBack, fadeAnim }) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loginError, setLoginError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		if (!username.trim() || !password.trim()) {
			setLoginError('Bitte Benutzername und Passwort eingeben.');
			return;
		}
		setLoading(true);
		setLoginError('');
		try {
			const valid = await verifyAdmin(username.trim(), password.trim());
			if (valid) {
				onLogin();
			} else {
				setLoginError('Ungültige Anmeldedaten.');
			}
		} catch {
			setLoginError('Fehler bei der Anmeldung.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<LinearGradient colors={[COLORS.background, '#1a0a2e']} style={styles.container}>
			<ScrollView contentContainerStyle={styles.loginScrollContent}>
				<Animated.View style={[styles.loginContainer, { opacity: fadeAnim }]}>
					<View style={styles.loginIconWrap}>
						<LinearGradient colors={['#EF4444', '#DC2626']} style={styles.loginIcon}>
							<Text style={styles.loginIconText}>🔐</Text>
						</LinearGradient>
					</View>

					<Text style={styles.loginTitle}>Lehrer-Bereich</Text>
					<Text style={styles.loginSubtitle}>
						Melde dich an, um Quizze zu verwalten und Ergebnisse zu sehen.
					</Text>

					<Card style={styles.loginCard}>
						{loginError ? (
							<View style={styles.errorBanner}>
								<Text style={styles.errorText}>⚠️ {loginError}</Text>
							</View>
						) : null}

						<Text style={styles.inputLabel}>BENUTZERNAME</Text>
						<TextInput
							style={styles.input}
							placeholder="admin"
							placeholderTextColor={COLORS.textMuted}
							value={username}
							onChangeText={setUsername}
							autoCapitalize="none"
						/>

						<Text style={styles.inputLabel}>PASSWORT</Text>
						<TextInput
							style={styles.input}
							placeholder="••••••••"
							placeholderTextColor={COLORS.textMuted}
							value={password}
							onChangeText={setPassword}
							secureTextEntry
						/>

						<GradientButton
							title={loading ? '⏳ Anmelden...' : '🔓 Anmelden'}
							onPress={handleLogin}
							variant="error"
							style={{ marginTop: SPACING.md }}
						/>
					</Card>

					<TouchableOpacity onPress={onBack} style={styles.backLink}>
						<Text style={styles.backLinkText}>← Zurück zum Login</Text>
					</TouchableOpacity>
				</Animated.View>
			</ScrollView>
		</LinearGradient>
	);
}

// ============================================================
// RESULTS TAB
// ============================================================
function ResultsTab() {
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(true);
	const [expandedId, setExpandedId] = useState(null);
	const [filterUser, setFilterUser] = useState('');

	useEffect(() => {
		loadResults();
	}, []);

	const loadResults = async () => {
		setLoading(true);
		try {
			const data = await getAllQuizResults();
			setResults(data);
		} catch (error) {
			console.error('Error loading results:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteResult = (id, username) => {
		Alert.alert('Ergebnis löschen?', `Möchtest du das Ergebnis von "${username}" wirklich löschen?`, [
			{ text: 'Abbrechen', style: 'cancel' },
			{ text: 'Löschen', style: 'destructive', onPress: async () => { await deleteQuizResult(id); loadResults(); } },
		]);
	};

	const handleDeleteAll = () => {
		Alert.alert('Alle Ergebnisse löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden.', [
			{ text: 'Abbrechen', style: 'cancel' },
			{ text: 'Alle löschen', style: 'destructive', onPress: async () => { await deleteAllQuizResults(); loadResults(); } },
		]);
	};

	const formatDate = (isoStr) => {
		const d = new Date(isoStr);
		return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	};

	const uniqueUsers = [...new Set(results.map(r => r.username))];
	const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
	const filteredResults = filterUser ? results.filter(r => r.username.toLowerCase().includes(filterUser.toLowerCase())) : results;

	if (loading) return <LoadingView message="Lade Ergebnisse..." />;

	return (
		<>
			{/* Stats */}
			<View style={styles.statsRow}>
				<StatsCard icon="📝" value={results.length} label="Abgaben" color={COLORS.primary} />
				<View style={{ width: SPACING.sm }} />
				<StatsCard icon="👥" value={uniqueUsers.length} label="Schüler" color={COLORS.accent} />
				<View style={{ width: SPACING.sm }} />
				<StatsCard icon="📊" value={`${avgScore}%`} label="Ø Score" color={avgScore >= 70 ? COLORS.success : COLORS.error} />
			</View>

			{/* Actions */}
			<View style={styles.actionsRow}>
				<TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDeleteAll}>
					<Text style={styles.actionBtnText}>🗑️ Alle löschen</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.actionBtn, styles.actionBtnRefresh]} onPress={loadResults}>
					<Text style={styles.actionBtnText}>🔄 Aktualisieren</Text>
				</TouchableOpacity>
			</View>

			{/* Filter */}
			<View style={styles.filterBar}>
				<TextInput
					style={styles.filterInput}
					placeholder="🔍  Schüler filtern..."
					placeholderTextColor={COLORS.textMuted}
					value={filterUser}
					onChangeText={setFilterUser}
				/>
			</View>

			{/* Results list */}
			{filteredResults.length === 0 ? (
				<EmptyState
					icon="📋"
					title="Keine Ergebnisse"
					subtitle={filterUser ? 'Kein Schüler passt zum Filter.' : 'Es wurden noch keine Quizze eingereicht.'}
				/>
			) : (
				filteredResults.map((result) => {
					const isExpanded = expandedId === result.id;
					const scoreColor = result.percentage >= 80 ? COLORS.success : result.percentage >= 50 ? COLORS.accent : COLORS.error;

					return (
						<TouchableOpacity key={result.id} onPress={() => setExpandedId(isExpanded ? null : result.id)} activeOpacity={0.8}>
							<Card style={[styles.resultCard, { borderLeftColor: scoreColor, borderLeftWidth: 4 }]}>
								<View style={styles.resultHeader}>
									<View style={styles.resultLeft}>
										<Text style={styles.resultUser}>👤 {result.username}</Text>
										<Text style={styles.resultQuiz}>{result.quizname}</Text>
										<Text style={styles.resultDate}>{formatDate(result.timestamp)}</Text>
									</View>
									<View style={styles.resultRight}>
										<View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20', borderColor: scoreColor }]}>
											<Text style={[styles.scoreBadgeText, { color: scoreColor }]}>{result.percentage}%</Text>
										</View>
										<Text style={styles.resultScore}>{result.score}/{result.totalQuestions}</Text>
									</View>
								</View>

								{isExpanded && result.details && (
									<View style={styles.detailSection}>
										<View style={styles.detailDivider} />
										<Text style={styles.detailSectionTitle}>📋 Detaillierte Antworten</Text>
										{result.details.map((d, i) => (
											<View key={i} style={[styles.detailRow, { borderLeftColor: d.isCorrect ? COLORS.success : COLORS.error }]}>
												<View style={styles.detailRowHeader}>
													<Text style={styles.detailQuery}>{d.query}</Text>
													<Badge text={d.isCorrect ? '✅ Richtig' : '❌ Falsch'} variant={d.isCorrect ? 'success' : 'error'} />
												</View>
												{!d.isCorrect && (
													<Text style={styles.detailCorrection}>Antwort: {d.userAnswer} → Richtig: {d.correctAnswer}</Text>
												)}
											</View>
										))}
										<TouchableOpacity style={styles.deleteResultBtn} onPress={() => handleDeleteResult(result.id, result.username)}>
											<Text style={styles.deleteResultText}>🗑️ Ergebnis löschen</Text>
										</TouchableOpacity>
									</View>
								)}
								{!isExpanded && <Text style={styles.expandHint}>Tippe für Details ▼</Text>}
							</Card>
						</TouchableOpacity>
					);
				})
			)}
		</>
	);
}

// ============================================================
// QUIZ MANAGEMENT TAB
// ============================================================
function QuizManagementTab() {
	const [quizNames, setQuizNames] = useState([]);
	const [selectedTopic, setSelectedTopic] = useState(null);
	const [topicItems, setTopicItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showNewTopic, setShowNewTopic] = useState(false);
	const [newTopicName, setNewTopicName] = useState('');
	const [showAddQuestion, setShowAddQuestion] = useState(false);
	const [newQuery, setNewQuery] = useState('');
	const [newAnswer, setNewAnswer] = useState('');
	const [editingItem, setEditingItem] = useState(null);
	const [editQuery, setEditQuery] = useState('');
	const [editAnswer, setEditAnswer] = useState('');

	useEffect(() => {
		loadTopics();
	}, []);

	const loadTopics = async () => {
		setLoading(true);
		try {
			const names = await getQuizNames();
			setQuizNames(names);
		} catch (error) {
			console.error('Error loading topics:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadTopicItems = async (name) => {
		try {
			const items = await getQuizByName(name);
			setTopicItems(items);
		} catch (error) {
			console.error('Error loading topic items:', error);
		}
	};

	const handleSelectTopic = async (name) => {
		setSelectedTopic(name);
		await loadTopicItems(name);
		setShowAddQuestion(false);
		setEditingItem(null);
	};

	const handleBackToTopics = () => {
		setSelectedTopic(null);
		setTopicItems([]);
		setShowAddQuestion(false);
		setEditingItem(null);
		loadTopics();
	};

	// --- TOPIC ACTIONS ---
	const handleCreateTopic = () => {
		if (!newTopicName.trim()) {
			Alert.alert('Fehler', 'Bitte einen Themenamen eingeben.');
			return;
		}
		if (quizNames.includes(newTopicName.trim())) {
			Alert.alert('Fehler', 'Dieses Thema existiert bereits.');
			return;
		}
		// Just navigate to the new topic - first question will create it
		setSelectedTopic(newTopicName.trim());
		setTopicItems([]);
		setShowNewTopic(false);
		setNewTopicName('');
		setShowAddQuestion(true);
	};

	const handleDeleteTopic = (name) => {
		Alert.alert(
			'Thema löschen?',
			`Möchtest du "${name}" und ALLE zugehörigen Fragen wirklich löschen?`,
			[
				{ text: 'Abbrechen', style: 'cancel' },
				{
					text: 'Löschen',
					style: 'destructive',
					onPress: async () => {
						await deleteQuizByName(name);
						if (selectedTopic === name) {
							handleBackToTopics();
						}
						loadTopics();
					},
				},
			]
		);
	};

	// --- QUESTION ACTIONS ---
	const handleAddQuestion = async () => {
		if (!newQuery.trim() || !newAnswer.trim()) {
			Alert.alert('Fehler', 'Bitte Frage und Antwort ausfüllen.');
			return;
		}
		try {
			await addQuizItem(selectedTopic, newQuery.trim(), newAnswer.trim());
			setNewQuery('');
			setNewAnswer('');
			setShowAddQuestion(false);
			await loadTopicItems(selectedTopic);
			// Reload topics to update count
			loadTopics();
		} catch (error) {
			Alert.alert('Fehler', 'Konnte nicht gespeichert werden.');
		}
	};

	const handleDeleteQuestion = (id, query) => {
		Alert.alert('Frage löschen?', `"${query}" wirklich löschen?`, [
			{ text: 'Abbrechen', style: 'cancel' },
			{
				text: 'Löschen',
				style: 'destructive',
				onPress: async () => {
					await deleteQuizItem(id);
					await loadTopicItems(selectedTopic);
					loadTopics();
				},
			},
		]);
	};

	const handleStartEdit = (item) => {
		setEditingItem(item.id);
		setEditQuery(item.query);
		setEditAnswer(item.answer);
	};

	const handleSaveEdit = async () => {
		if (!editQuery.trim() || !editAnswer.trim()) {
			Alert.alert('Fehler', 'Frage und Antwort dürfen nicht leer sein.');
			return;
		}
		try {
			await updateQuizItem(editingItem, selectedTopic, editQuery.trim(), editAnswer.trim());
			setEditingItem(null);
			await loadTopicItems(selectedTopic);
		} catch (error) {
			Alert.alert('Fehler', 'Konnte nicht gespeichert werden.');
		}
	};

	const handleCancelEdit = () => {
		setEditingItem(null);
		setEditQuery('');
		setEditAnswer('');
	};

	if (loading) return <LoadingView message="Lade Themen..." />;

	// ---- TOPIC DETAIL VIEW ----
	if (selectedTopic) {
		return (
			<>
				{/* Back button + Topic header */}
				<TouchableOpacity onPress={handleBackToTopics} style={styles.backBtn}>
					<Text style={styles.backBtnText}>← Alle Themen</Text>
				</TouchableOpacity>

				<View style={styles.topicDetailHeader}>
					<View style={{ flex: 1 }}>
						<Text style={styles.topicDetailTitle}>📚 {selectedTopic}</Text>
						<Text style={styles.topicDetailCount}>{topicItems.length} Fragen</Text>
					</View>
					<View style={styles.topicDetailActions}>
						<TouchableOpacity
							style={[styles.topicActionBtn, { backgroundColor: COLORS.success + '15', borderColor: COLORS.success + '40' }]}
							onPress={() => { setShowAddQuestion(!showAddQuestion); setEditingItem(null); }}
						>
							<Text style={[styles.topicActionBtnText, { color: COLORS.success }]}>
								{showAddQuestion ? '✕ Abbrechen' : '+ Frage hinzufügen'}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.topicActionBtn, { backgroundColor: COLORS.error + '15', borderColor: COLORS.error + '40' }]}
							onPress={() => handleDeleteTopic(selectedTopic)}
						>
							<Text style={[styles.topicActionBtnText, { color: COLORS.error }]}>🗑️ Thema löschen</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Add question form */}
				{showAddQuestion && (
					<Card style={styles.addQuestionCard}>
						<Text style={styles.formSectionTitle}>Neue Frage hinzufügen</Text>
						<Text style={styles.inputLabel}>BEGRIFF / FRAGE</Text>
						<TextInput
							style={styles.input}
							placeholder="z.B. Primary Key"
							placeholderTextColor={COLORS.textMuted}
							value={newQuery}
							onChangeText={setNewQuery}
						/>
						<Text style={styles.inputLabel}>ANTWORT / DEFINITION</Text>
						<TextInput
							style={[styles.input, styles.inputMultiline]}
							placeholder="Die vollständige Definition..."
							placeholderTextColor={COLORS.textMuted}
							value={newAnswer}
							onChangeText={setNewAnswer}
							multiline
							numberOfLines={3}
						/>
						<GradientButton
							title="💾 Frage speichern"
							onPress={handleAddQuestion}
							variant="success"
							style={{ marginTop: SPACING.md }}
						/>
					</Card>
				)}

				{/* Questions list */}
				{topicItems.length === 0 ? (
					<EmptyState
						icon="❓"
						title="Keine Fragen"
						subtitle="Füge die erste Frage zu diesem Thema hinzu."
					/>
				) : (
					topicItems.map((item, index) => {
						const isEditing = editingItem === item.id;

						return (
							<Card key={item.id} style={styles.questionCard}>
								{isEditing ? (
									/* EDIT MODE */
									<View>
										<Text style={styles.formSectionTitle}>✏️ Frage bearbeiten</Text>
										<Text style={styles.inputLabel}>BEGRIFF / FRAGE</Text>
										<TextInput
											style={styles.input}
											value={editQuery}
											onChangeText={setEditQuery}
										/>
										<Text style={styles.inputLabel}>ANTWORT / DEFINITION</Text>
										<TextInput
											style={[styles.input, styles.inputMultiline]}
											value={editAnswer}
											onChangeText={setEditAnswer}
											multiline
											numberOfLines={3}
										/>
										<View style={styles.editButtonRow}>
											<GradientButton
												title="💾 Speichern"
												onPress={handleSaveEdit}
												variant="success"
												style={{ flex: 1, marginRight: SPACING.sm }}
											/>
											<GradientButton
												title="✕ Abbrechen"
												onPress={handleCancelEdit}
												variant="error"
												style={{ flex: 1, marginLeft: SPACING.sm }}
											/>
										</View>
									</View>
								) : (
									/* VIEW MODE */
									<View>
										<View style={styles.questionHeader}>
											<View style={styles.questionNumber}>
												<Text style={styles.questionNumberText}>{index + 1}</Text>
											</View>
											<View style={{ flex: 1 }}>
												<Text style={styles.questionQuery}>{item.query}</Text>
											</View>
										</View>
										<Text style={styles.questionAnswer}>{item.answer}</Text>
										<View style={styles.questionActions}>
											<TouchableOpacity
												style={[styles.qActionBtn, { borderColor: COLORS.accent + '40' }]}
												onPress={() => handleStartEdit(item)}
											>
												<Text style={[styles.qActionBtnText, { color: COLORS.accent }]}>✏️ Bearbeiten</Text>
											</TouchableOpacity>
											<TouchableOpacity
												style={[styles.qActionBtn, { borderColor: COLORS.error + '40' }]}
												onPress={() => handleDeleteQuestion(item.id, item.query)}
											>
												<Text style={[styles.qActionBtnText, { color: COLORS.error }]}>🗑️ Löschen</Text>
											</TouchableOpacity>
										</View>
									</View>
								)}
							</Card>
						);
					})
				)}
			</>
		);
	}

	// ---- TOPICS OVERVIEW ----
	return (
		<>
			{/* New topic button */}
			<TouchableOpacity
				style={styles.newTopicToggle}
				onPress={() => setShowNewTopic(!showNewTopic)}
			>
				<LinearGradient
					colors={showNewTopic ? [COLORS.error, '#F87171'] : [COLORS.success, '#34D399']}
					style={styles.newTopicToggleInner}
				>
					<Text style={styles.newTopicToggleText}>
						{showNewTopic ? '✕ Abbrechen' : '+ Neues Thema erstellen'}
					</Text>
				</LinearGradient>
			</TouchableOpacity>

			{/* New topic form */}
			{showNewTopic && (
				<Card style={styles.newTopicCard}>
					<Text style={styles.formSectionTitle}>Neues Themengebiet</Text>
					<Text style={styles.inputLabel}>THEMA / NAME</Text>
					<TextInput
						style={styles.input}
						placeholder="z.B. Netzwerk-Grundlagen"
						placeholderTextColor={COLORS.textMuted}
						value={newTopicName}
						onChangeText={setNewTopicName}
					/>
					<GradientButton
						title="📚 Thema erstellen & Fragen hinzufügen"
						onPress={handleCreateTopic}
						variant="success"
						style={{ marginTop: SPACING.md }}
					/>
				</Card>
			)}

			{/* Topics list */}
			{quizNames.length === 0 ? (
				<EmptyState
					icon="📚"
					title="Keine Themen"
					subtitle="Erstelle dein erstes Themengebiet mit dem Button oben."
				/>
			) : (
				quizNames.map((name) => (
					<TouchableOpacity key={name} onPress={() => handleSelectTopic(name)} activeOpacity={0.7}>
						<Card style={styles.topicCard}>
							<View style={styles.topicCardContent}>
								<View style={styles.topicCardIcon}>
									<Text style={styles.topicCardEmoji}>📚</Text>
								</View>
								<View style={{ flex: 1 }}>
									<Text style={styles.topicCardTitle}>{name}</Text>
									<Text style={styles.topicCardDesc}>Tippe zum Bearbeiten</Text>
								</View>
								<TouchableOpacity
									style={styles.topicDeleteBtn}
									onPress={() => handleDeleteTopic(name)}
									hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
								>
									<Text style={styles.topicDeleteText}>🗑️</Text>
								</TouchableOpacity>
								<Text style={styles.topicCardArrow}>→</Text>
							</View>
						</Card>
					</TouchableOpacity>
				))
			)}
		</>
	);
}

// ============================================================
// MAIN ADMIN SCREEN
// ============================================================
export default function AdminScreen({ navigation }) {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [activeTab, setActiveTab] = useState('results'); // 'results' | 'quizzes'
	const [showPasswordChange, setShowPasswordChange] = useState(false);
	const [newPassword, setNewPassword] = useState('');

	const fadeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 500,
			useNativeDriver: true,
		}).start();
	}, [isLoggedIn]);

	const handleLogin = () => {
		setIsLoggedIn(true);
		fadeAnim.setValue(0);
	};

	const handleLogout = () => {
		setIsLoggedIn(false);
		setActiveTab('results');
		fadeAnim.setValue(0);
	};

	const handleChangePassword = async () => {
		if (!newPassword.trim() || newPassword.trim().length < 4) {
			Alert.alert('Fehler', 'Mindestens 4 Zeichen.');
			return;
		}
		try {
			await updateAdminPassword(newPassword.trim());
			setNewPassword('');
			setShowPasswordChange(false);
			Alert.alert('Erfolg', 'Passwort wurde geändert.');
		} catch {
			Alert.alert('Fehler', 'Passwort konnte nicht geändert werden.');
		}
	};

	// --- LOGIN VIEW ---
	if (!isLoggedIn) {
		return (
			<AdminLogin
				onLogin={handleLogin}
				onBack={() => navigation.goBack()}
				fadeAnim={fadeAnim}
			/>
		);
	}

	// --- DASHBOARD ---
	return (
		<LinearGradient colors={[COLORS.background, '#1a0a2e']} style={styles.container}>
			<ScrollView contentContainerStyle={styles.dashboardContainer}>
				<Animated.View style={{ opacity: fadeAnim }}>
					{/* Header */}
					<View style={styles.dashHeader}>
						<View>
							<Text style={styles.dashTitle}>📊 Lehrer-Dashboard</Text>
							<Text style={styles.dashSubtitle}>Quiz-Verwaltung & Ergebnisse</Text>
						</View>
						<TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
							<Text style={styles.logoutText}>🚪 Abmelden</Text>
						</TouchableOpacity>
					</View>

					{/* Tab Switcher */}
					<View style={styles.tabSwitcher}>
						<TouchableOpacity
							style={[styles.tabBtn, activeTab === 'results' && styles.tabBtnActive]}
							onPress={() => setActiveTab('results')}
						>
							<Text style={[styles.tabBtnText, activeTab === 'results' && styles.tabBtnTextActive]}>
								📊 Ergebnisse
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.tabBtn, activeTab === 'quizzes' && styles.tabBtnActive]}
							onPress={() => setActiveTab('quizzes')}
						>
							<Text style={[styles.tabBtnText, activeTab === 'quizzes' && styles.tabBtnTextActive]}>
								📚 Quiz-Verwaltung
							</Text>
						</TouchableOpacity>
					</View>

					{/* Password Change (shared) */}
					<TouchableOpacity
						style={styles.pwToggle}
						onPress={() => setShowPasswordChange(!showPasswordChange)}
					>
						<Text style={styles.pwToggleText}>
							{showPasswordChange ? '✕ Abbrechen' : '🔑 Passwort ändern'}
						</Text>
					</TouchableOpacity>

					{showPasswordChange && (
						<Card style={styles.passwordCard}>
							<Text style={styles.formSectionTitle}>Neues Passwort setzen</Text>
							<TextInput
								style={styles.input}
								placeholder="Neues Passwort (mind. 4 Zeichen)"
								placeholderTextColor={COLORS.textMuted}
								value={newPassword}
								onChangeText={setNewPassword}
								secureTextEntry
							/>
							<GradientButton
								title="💾 Passwort speichern"
								onPress={handleChangePassword}
								variant="success"
								style={{ marginTop: SPACING.sm }}
							/>
						</Card>
					)}

					{/* Tab Content */}
					{activeTab === 'results' ? <ResultsTab /> : <QuizManagementTab />}
				</Animated.View>
			</ScrollView>
		</LinearGradient>
	);
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
	container: { flex: 1 },

	// === LOGIN ===
	loginScrollContent: { flexGrow: 1, justifyContent: 'center' },
	loginContainer: { flex: 1, padding: SPACING.xxl },
	loginIconWrap: { alignItems: 'center', marginBottom: SPACING.xl },
	loginIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg },
	loginIconText: { fontSize: 36 },
	loginTitle: { fontSize: FONTS.sizes.xxxl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.xs },
	loginSubtitle: { fontSize: FONTS.sizes.md, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xxl, lineHeight: 22 },
	loginCard: { padding: SPACING.xl },
	errorBanner: { backgroundColor: COLORS.error + '20', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.error + '40' },
	errorText: { color: COLORS.error, fontSize: FONTS.sizes.sm, textAlign: 'center' },
	backLink: { alignItems: 'center', marginTop: SPACING.xl },
	backLinkText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },

	// === SHARED ===
	inputLabel: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.textMuted, letterSpacing: 1, marginBottom: SPACING.xs, marginTop: SPACING.md },
	input: {
		backgroundColor: COLORS.background,
		borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
		paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
		fontSize: FONTS.sizes.md, color: COLORS.textPrimary,
	},
	inputMultiline: { minHeight: 80, textAlignVertical: 'top' },

	// === DASHBOARD ===
	dashboardContainer: { padding: SPACING.lg, paddingBottom: SPACING.huge },
	dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg, paddingTop: SPACING.lg },
	dashTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
	dashSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
	logoutBtn: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
	logoutText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },

	// Tab Switcher
	tabSwitcher: {
		flexDirection: 'row',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		padding: 4,
		marginBottom: SPACING.lg,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	tabBtn: {
		flex: 1,
		paddingVertical: SPACING.md,
		alignItems: 'center',
		borderRadius: RADIUS.md,
	},
	tabBtnActive: {
		backgroundColor: COLORS.primary,
	},
	tabBtnText: {
		fontSize: FONTS.sizes.sm,
		fontWeight: FONTS.weights.semiBold,
		color: COLORS.textMuted,
	},
	tabBtnTextActive: {
		color: COLORS.white,
	},

	// Password
	pwToggle: { alignSelf: 'flex-start', marginBottom: SPACING.md },
	pwToggleText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
	passwordCard: { marginBottom: SPACING.lg },
	formSectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm },

	// === RESULTS TAB ===
	statsRow: { flexDirection: 'row', marginBottom: SPACING.lg },
	actionsRow: { flexDirection: 'row', marginBottom: SPACING.lg, gap: SPACING.sm },
	actionBtn: { flex: 1, backgroundColor: COLORS.surface, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
	actionBtnDanger: { borderColor: COLORS.error + '40' },
	actionBtnRefresh: { borderColor: COLORS.primary + '40' },
	actionBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.medium },
	filterBar: { marginBottom: SPACING.lg },
	filterInput: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },

	// Result cards
	resultCard: { marginBottom: SPACING.md },
	resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	resultLeft: { flex: 1 },
	resultUser: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: 2 },
	resultQuiz: { fontSize: FONTS.sizes.sm, color: COLORS.primaryLight, fontWeight: FONTS.weights.medium },
	resultDate: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 4 },
	resultRight: { alignItems: 'center' },
	scoreBadge: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: 4 },
	scoreBadgeText: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.extraBold },
	resultScore: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
	expandHint: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm, fontStyle: 'italic' },

	// Detail
	detailSection: { marginTop: SPACING.md },
	detailDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.md },
	detailSectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary, marginBottom: SPACING.md },
	detailRow: { borderLeftWidth: 3, paddingLeft: SPACING.md, marginBottom: SPACING.md },
	detailRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	detailQuery: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semiBold, color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm },
	detailCorrection: { fontSize: FONTS.sizes.xs, color: COLORS.error, marginTop: 4, fontStyle: 'italic' },
	deleteResultBtn: { alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
	deleteResultText: { color: COLORS.error, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium },

	// === QUIZ MANAGEMENT TAB ===
	// New topic
	newTopicToggle: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.md },
	newTopicToggleInner: { paddingVertical: SPACING.md, alignItems: 'center', borderRadius: RADIUS.md },
	newTopicToggleText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },
	newTopicCard: { marginBottom: SPACING.lg },

	// Topic cards
	topicCard: { marginBottom: SPACING.md },
	topicCardContent: { flexDirection: 'row', alignItems: 'center' },
	topicCardIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
	topicCardEmoji: { fontSize: 24 },
	topicCardTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.semiBold, color: COLORS.textPrimary },
	topicCardDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
	topicDeleteBtn: { padding: SPACING.sm, marginRight: SPACING.sm },
	topicDeleteText: { fontSize: 18 },
	topicCardArrow: { fontSize: FONTS.sizes.xxl, color: COLORS.primary, fontWeight: FONTS.weights.bold },

	// Topic detail
	backBtn: { marginBottom: SPACING.md },
	backBtnText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.medium },
	topicDetailHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.lg, flexWrap: 'wrap' },
	topicDetailTitle: { fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
	topicDetailCount: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
	topicDetailActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
	topicActionBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1 },
	topicActionBtnText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium },

	// Add question
	addQuestionCard: { marginBottom: SPACING.lg },

	// Question cards
	questionCard: { marginBottom: SPACING.md },
	questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
	questionNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '25', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
	questionNumberText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold },
	questionQuery: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semiBold, color: COLORS.textPrimary },
	questionAnswer: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.md, paddingLeft: 44 },
	questionActions: { flexDirection: 'row', gap: SPACING.sm, paddingLeft: 44 },
	qActionBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
	qActionBtnText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.medium },

	// Edit
	editButtonRow: { flexDirection: 'row', marginTop: SPACING.md },
});

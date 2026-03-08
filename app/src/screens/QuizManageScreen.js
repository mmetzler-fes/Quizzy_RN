import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	Alert,
	Animated,
	TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import {
	GradientButton,
	Card,
	StyledInput,
	LoadingView,
	EmptyState,
	Badge,
} from '../components/UI';
import {
	getAllQuizItems,
	addQuizItem,
	deleteQuizItem,
	getQuizNames,
} from '../database/database';

export default function QuizManageScreen() {
	const [quizItems, setQuizItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [quizname, setQuizname] = useState('');
	const [query, setQuery] = useState('');
	const [answer, setAnswer] = useState('');
	const [searchText, setSearchText] = useState('');

	const formAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {
		Animated.timing(formAnim, {
			toValue: showForm ? 1 : 0,
			duration: 300,
			useNativeDriver: false,
		}).start();
	}, [showForm]);

	const loadData = async () => {
		try {
			const items = await getAllQuizItems();
			setQuizItems(items);
		} catch (error) {
			console.error('Error loading quiz items:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleAdd = async () => {
		if (!quizname.trim() || !query.trim() || !answer.trim()) {
			Alert.alert('Fehler', 'Bitte alle Felder ausfüllen.');
			return;
		}

		try {
			await addQuizItem(quizname.trim(), query.trim(), answer.trim());
			setQuizname('');
			setQuery('');
			setAnswer('');
			setShowForm(false);
			loadData();
		} catch (error) {
			Alert.alert('Fehler', 'Konnte nicht gespeichert werden.');
		}
	};

	const handleDelete = (id, term) => {
		Alert.alert(
			'Löschen?',
			`Möchtest du "${term}" wirklich löschen?`,
			[
				{ text: 'Abbrechen', style: 'cancel' },
				{
					text: 'Löschen',
					style: 'destructive',
					onPress: async () => {
						await deleteQuizItem(id);
						loadData();
					},
				},
			]
		);
	};

	const filteredItems = searchText
		? quizItems.filter(
			(item) =>
				item.query.toLowerCase().includes(searchText.toLowerCase()) ||
				item.answer.toLowerCase().includes(searchText.toLowerCase()) ||
				item.quizname.toLowerCase().includes(searchText.toLowerCase())
		)
		: quizItems;

	// Group by quizname
	const grouped = filteredItems.reduce((acc, item) => {
		if (!acc[item.quizname]) acc[item.quizname] = [];
		acc[item.quizname].push(item);
		return acc;
	}, {});

	if (loading) return <LoadingView message="Daten werden geladen..." />;

	const formMaxHeight = formAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 500],
	});

	const renderItem = ({ item }) => (
		<View style={styles.listItem}>
			<View style={styles.listItemContent}>
				<Text style={styles.listItemTerm}>{item.query}</Text>
				<Text style={styles.listItemAnswer} numberOfLines={2}>
					{item.answer}
				</Text>
			</View>
			<TouchableOpacity
				onPress={() => handleDelete(item.id, item.query)}
				style={styles.deleteButton}
			>
				<Text style={styles.deleteText}>🗑️</Text>
			</TouchableOpacity>
		</View>
	);

	const renderGroupHeader = (quizname, items) => (
		<View key={quizname}>
			<View style={styles.groupHeader}>
				<Badge text={quizname} variant="primary" />
				<Text style={styles.groupCount}>{items.length} Einträge</Text>
			</View>
			{items.map((item) => (
				<View key={item.id}>{renderItem({ item })}</View>
			))}
		</View>
	);

	return (
		<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
			{/* Search bar */}
			<View style={styles.searchBar}>
				<TextInput
					style={styles.searchInput}
					placeholder="🔍  Suchen..."
					placeholderTextColor={COLORS.textMuted}
					value={searchText}
					onChangeText={setSearchText}
				/>
				<TouchableOpacity
					style={styles.addToggle}
					onPress={() => setShowForm(!showForm)}
				>
					<LinearGradient
						colors={showForm ? [COLORS.error, '#F87171'] : [COLORS.primary, '#8B5CF6']}
						style={styles.addToggleGradient}
					>
						<Text style={styles.addToggleText}>{showForm ? '✕' : '+'}</Text>
					</LinearGradient>
				</TouchableOpacity>
			</View>

			{/* Add form */}
			<Animated.View style={[styles.formWrapper, { maxHeight: formMaxHeight, opacity: formAnim }]}>
				<Card style={styles.formCard}>
					<Text style={styles.formTitle}>Neuen Quiz-Eintrag hinzufügen</Text>
					<StyledInput
						label="Quizname"
						placeholder="z.B. DB Grundbegriffe"
						value={quizname}
						onChangeText={setQuizname}
					/>
					<StyledInput
						label="Begriff / Frage"
						placeholder="z.B. Primary Key"
						value={query}
						onChangeText={setQuery}
					/>
					<StyledInput
						label="Antwort / Definition"
						placeholder="Die Definition..."
						value={answer}
						onChangeText={setAnswer}
						multiline
					/>
					<GradientButton
						title="💾  Speichern"
						onPress={handleAdd}
						variant="success"
					/>
				</Card>
			</Animated.View>

			{/* List */}
			<FlatList
				data={[{ key: 'content' }]}
				renderItem={() => (
					<View style={styles.listContainer}>
						{Object.keys(grouped).length === 0 ? (
							<EmptyState
								icon="📝"
								title="Keine Quiz-Einträge"
								subtitle="Tippe auf + um neue Einträge hinzuzufügen."
							/>
						) : (
							Object.entries(grouped).map(([name, items]) =>
								renderGroupHeader(name, items)
							)
						)}
					</View>
				)}
				contentContainerStyle={styles.flatListContent}
			/>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	searchBar: {
		flexDirection: 'row',
		paddingHorizontal: SPACING.lg,
		paddingTop: SPACING.lg,
		paddingBottom: SPACING.sm,
		alignItems: 'center',
		gap: SPACING.md,
	},
	searchInput: {
		flex: 1,
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADIUS.full,
		paddingHorizontal: SPACING.xl,
		paddingVertical: SPACING.md,
		fontSize: FONTS.sizes.md,
		color: COLORS.textPrimary,
	},
	addToggle: {
		borderRadius: RADIUS.full,
		overflow: 'hidden',
	},
	addToggleGradient: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
	},
	addToggleText: {
		color: COLORS.white,
		fontSize: FONTS.sizes.xxl,
		fontWeight: FONTS.weights.bold,
	},

	// Form
	formWrapper: {
		overflow: 'hidden',
		paddingHorizontal: SPACING.lg,
	},
	formCard: {
		marginTop: SPACING.sm,
		marginBottom: SPACING.md,
	},
	formTitle: {
		fontSize: FONTS.sizes.lg,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
		marginBottom: SPACING.lg,
	},

	// List
	flatListContent: {
		paddingBottom: SPACING.huge,
	},
	listContainer: {
		paddingHorizontal: SPACING.lg,
	},
	groupHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: SPACING.xl,
		marginBottom: SPACING.md,
	},
	groupCount: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
	},
	listItem: {
		flexDirection: 'row',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.md,
		padding: SPACING.md,
		marginBottom: SPACING.sm,
		borderWidth: 1,
		borderColor: COLORS.border,
		alignItems: 'center',
	},
	listItemContent: {
		flex: 1,
	},
	listItemTerm: {
		fontSize: FONTS.sizes.md,
		fontWeight: FONTS.weights.semiBold,
		color: COLORS.textPrimary,
		marginBottom: 2,
	},
	listItemAnswer: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		lineHeight: 18,
	},
	deleteButton: {
		padding: SPACING.sm,
		marginLeft: SPACING.sm,
	},
	deleteText: {
		fontSize: 20,
	},
});

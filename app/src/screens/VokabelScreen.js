import React, { useState, useEffect, useRef } from 'react';
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
} from '../components/UI';
import {
	getAllQuizItems,
	addQuizItem,
	deleteQuizItem,
} from '../database/database';

export default function VokabelScreen() {
	const [vokabeln, setVokabeln] = useState([]);
	const [allItems, setAllItems] = useState([]);
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
			const data = await getAllQuizItems();
			setAllItems(data);
			setVokabeln(data);
		} catch (error) {
			console.error('Error loading vokabeln:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (text) => {
		setSearchText(text);
		if (text.trim()) {
			const lower = text.trim().toLowerCase();
			const filtered = allItems.filter(
				(item) =>
					item.query.toLowerCase().includes(lower) ||
					item.answer.toLowerCase().includes(lower) ||
					item.quizname.toLowerCase().includes(lower)
			);
			setVokabeln(filtered);
		} else {
			setVokabeln(allItems);
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

	if (loading) return <LoadingView message="Vokabeln werden geladen..." />;

	const formMaxHeight = formAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 400],
	});

	const renderItem = ({ item, index }) => (
		<Animated.View style={styles.listItem}>
			<View style={styles.listItemLeft}>
				<View style={styles.indexBadge}>
					<Text style={styles.indexText}>{index + 1}</Text>
				</View>
			</View>
			<View style={styles.listItemContent}>
				<Text style={styles.listItemName}>{item.query}</Text>
				<View style={styles.listItemBottom}>
					<Text style={styles.listItemLang}>📚 {item.quizname}</Text>
				</View>
				<Text style={styles.listItemVokabel} numberOfLines={2}>{item.answer}</Text>
			</View>
			<TouchableOpacity
				onPress={() => handleDelete(item.id, item.query)}
				style={styles.deleteButton}
			>
				<Text style={styles.deleteText}>🗑️</Text>
			</TouchableOpacity>
		</Animated.View>
	);

	return (
		<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>
			{/* Header area */}
			<View style={styles.header}>
				<View>
					<Text style={styles.headerTitle}>Vokabeln</Text>
					<Text style={styles.headerCount}>{vokabeln.length} Einträge</Text>
				</View>
			</View>

			{/* Search bar */}
			<View style={styles.searchBar}>
				<TextInput
					style={styles.searchInput}
					placeholder="🔍  Suchen..."
					placeholderTextColor={COLORS.textMuted}
					value={searchText}
					onChangeText={handleSearch}
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
					<Text style={styles.formTitle}>Neuen Eintrag hinzufügen</Text>
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

			{/* Vocabulary list */}
			<FlatList
				data={vokabeln}
				renderItem={renderItem}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.listContent}
				ListEmptyComponent={
					<EmptyState
						icon="📖"
						title="Keine Vokabeln"
						subtitle="Tippe auf + um neue Vokabeln hinzuzufügen."
					/>
				}
			/>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingHorizontal: SPACING.lg,
		paddingTop: SPACING.lg,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: FONTS.sizes.xxl,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
	},
	headerCount: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		marginTop: 2,
	},

	// Search
	searchBar: {
		flexDirection: 'row',
		paddingHorizontal: SPACING.lg,
		paddingTop: SPACING.md,
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
	listContent: {
		paddingHorizontal: SPACING.lg,
		paddingBottom: SPACING.huge,
		paddingTop: SPACING.sm,
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
	listItemLeft: {
		marginRight: SPACING.md,
	},
	indexBadge: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: COLORS.primary + '25',
		alignItems: 'center',
		justifyContent: 'center',
	},
	indexText: {
		color: COLORS.primaryLight,
		fontSize: FONTS.sizes.sm,
		fontWeight: FONTS.weights.bold,
	},
	listItemContent: {
		flex: 1,
	},
	listItemName: {
		fontSize: FONTS.sizes.md,
		fontWeight: FONTS.weights.semiBold,
		color: COLORS.textPrimary,
		marginBottom: 4,
	},
	listItemBottom: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	listItemLang: {
		fontSize: FONTS.sizes.xs,
		color: COLORS.textMuted,
		marginRight: SPACING.sm,
	},
	listItemVokabel: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.primaryLight,
		fontWeight: FONTS.weights.medium,
	},
	deleteButton: {
		padding: SPACING.sm,
		marginLeft: SPACING.sm,
	},
	deleteText: {
		fontSize: 20,
	},
});

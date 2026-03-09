import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { LoadingView, EmptyState } from '../components/UI';
import { getQuizNames } from '../database/database';

const SELECTED_KEY = '@quizzy_selected_topics';

export async function getSelectedTopics() {
	try {
		const raw = await AsyncStorage.getItem(SELECTED_KEY);
		return raw ? JSON.parse(raw) : null; // null = all selected (no filter)
	} catch {
		return null;
	}
}

export default function QuizManageScreen() {
	const [allTopics, setAllTopics] = useState([]);
	const [selected, setSelected] = useState(new Set()); // selected topic names
	const [loading, setLoading] = useState(true);
	const [savedAnim] = useState(new Animated.Value(0));
	const [showSaved, setShowSaved] = useState(false);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [])
	);

	const loadData = async () => {
		try {
			const topics = await getQuizNames();
			setAllTopics(topics);

			// Load saved selection; if none saved → select all by default
			const raw = await AsyncStorage.getItem(SELECTED_KEY);
			if (raw) {
				setSelected(new Set(JSON.parse(raw)));
			} else {
				setSelected(new Set(topics)); // all selected by default
			}
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const toggleTopic = async (name) => {
		const next = new Set(selected);
		if (next.has(name)) {
			next.delete(name);
		} else {
			next.add(name);
		}
		setSelected(next);
		await AsyncStorage.setItem(SELECTED_KEY, JSON.stringify([...next]));
		flashSaved();
	};

	const selectAll = async () => {
		const next = new Set(allTopics);
		setSelected(next);
		await AsyncStorage.setItem(SELECTED_KEY, JSON.stringify([...next]));
		flashSaved();
	};

	const deselectAll = async () => {
		setSelected(new Set());
		await AsyncStorage.setItem(SELECTED_KEY, JSON.stringify([]));
		flashSaved();
	};

	const flashSaved = () => {
		setShowSaved(true);
		savedAnim.setValue(0);
		Animated.sequence([
			Animated.timing(savedAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
			Animated.delay(1200),
			Animated.timing(savedAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
		]).start(() => setShowSaved(false));
	};

	if (loading) return <LoadingView message="Themen werden geladen..." />;

	const allChecked = allTopics.every(t => selected.has(t));
	const noneChecked = allTopics.every(t => !selected.has(t));

	return (
		<LinearGradient colors={[COLORS.background, '#1a1040']} style={styles.container}>

			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title}>📋 Themen auswählen</Text>
				<Text style={styles.subtitle}>
					Wähle aus, welche Themen im Quiz abgefragt werden sollen.
				</Text>
			</View>

			{/* Select all / none buttons */}
			{allTopics.length > 0 && (
				<View style={styles.bulkRow}>
					<TouchableOpacity
						style={[styles.bulkBtn, allChecked && styles.bulkBtnActive]}
						onPress={selectAll}
					>
						<Text style={[styles.bulkBtnText, allChecked && styles.bulkBtnTextActive]}>
							✓ Alle auswählen
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.bulkBtn, noneChecked && styles.bulkBtnDanger]}
						onPress={deselectAll}
					>
						<Text style={[styles.bulkBtnText, noneChecked && styles.bulkBtnTextDanger]}>
							✕ Alle abwählen
						</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* Topic list */}
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
			>
				{allTopics.length === 0 ? (
					<EmptyState
						icon="📚"
						title="Keine Themen vorhanden"
						subtitle="Der Lehrer muss zuerst Quiz-Themen anlegen."
					/>
				) : (
					allTopics.map((name) => {
						const isChecked = selected.has(name);
						return (
							<TouchableOpacity
								key={name}
								style={[styles.topicRow, isChecked && styles.topicRowChecked]}
								onPress={() => toggleTopic(name)}
								activeOpacity={0.7}
							>
								{/* Checkbox */}
								<View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
									{isChecked && <Text style={styles.checkmark}>✓</Text>}
								</View>

								{/* Topic icon + name */}
								<View style={styles.topicIcon}>
									<Text style={styles.topicEmoji}>📚</Text>
								</View>
								<Text style={[styles.topicName, isChecked && styles.topicNameChecked]}>
									{name}
								</Text>
							</TouchableOpacity>
						);
					})
				)}
			</ScrollView>

			{/* Saved toast */}
			{showSaved && (
				<Animated.View style={[styles.savedToast, { opacity: savedAnim }]}>
					<Text style={styles.savedToastText}>✓ Gespeichert</Text>
				</Animated.View>
			)}
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },

	header: {
		paddingHorizontal: SPACING.xl,
		paddingTop: SPACING.xl,
		paddingBottom: SPACING.md,
	},
	title: {
		fontSize: FONTS.sizes.xxl,
		fontWeight: FONTS.weights.bold,
		color: COLORS.textPrimary,
		marginBottom: SPACING.xs,
	},
	subtitle: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		lineHeight: 18,
	},

	bulkRow: {
		flexDirection: 'row',
		paddingHorizontal: SPACING.xl,
		paddingBottom: SPACING.md,
		gap: SPACING.md,
	},
	bulkBtn: {
		flex: 1,
		paddingVertical: SPACING.sm,
		paddingHorizontal: SPACING.md,
		borderRadius: RADIUS.full,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		alignItems: 'center',
	},
	bulkBtnActive: {
		borderColor: COLORS.success + '80',
		backgroundColor: COLORS.success + '15',
	},
	bulkBtnDanger: {
		borderColor: COLORS.error + '80',
		backgroundColor: COLORS.error + '15',
	},
	bulkBtnText: {
		fontSize: FONTS.sizes.sm,
		color: COLORS.textMuted,
		fontWeight: FONTS.weights.medium,
	},
	bulkBtnTextActive: { color: COLORS.success },
	bulkBtnTextDanger: { color: COLORS.error },

	listContent: {
		paddingHorizontal: SPACING.xl,
		paddingBottom: SPACING.huge,
	},

	topicRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.surface,
		borderRadius: RADIUS.lg,
		padding: SPACING.lg,
		marginBottom: SPACING.md,
		borderWidth: 1.5,
		borderColor: COLORS.border,
		...SHADOWS.sm,
	},
	topicRowChecked: {
		borderColor: COLORS.primary + '80',
		backgroundColor: COLORS.primary + '12',
	},

	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: COLORS.border,
		backgroundColor: COLORS.background,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING.md,
		flexShrink: 0,
	},
	checkboxChecked: {
		borderColor: COLORS.primary,
		backgroundColor: COLORS.primary,
	},
	checkmark: {
		color: COLORS.white,
		fontSize: 14,
		fontWeight: FONTS.weights.bold,
		lineHeight: 16,
	},

	topicIcon: {
		width: 36,
		height: 36,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary + '20',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING.md,
		flexShrink: 0,
	},
	topicEmoji: { fontSize: 18 },

	topicName: {
		flex: 1,
		fontSize: FONTS.sizes.md,
		fontWeight: FONTS.weights.semiBold,
		color: COLORS.textSecondary,
	},
	topicNameChecked: {
		color: COLORS.textPrimary,
	},

	savedToast: {
		position: 'absolute',
		bottom: SPACING.xxl,
		alignSelf: 'center',
		backgroundColor: COLORS.success,
		paddingHorizontal: SPACING.xl,
		paddingVertical: SPACING.sm,
		borderRadius: RADIUS.full,
		...SHADOWS.md,
	},
	savedToastText: {
		color: COLORS.white,
		fontWeight: FONTS.weights.bold,
		fontSize: FONTS.sizes.sm,
	},
});

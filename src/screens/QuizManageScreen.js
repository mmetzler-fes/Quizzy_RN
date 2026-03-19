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
import { FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { LoadingView, EmptyState } from '../components/UI';
import { getQuizNames, getSelectedTopics, setSelectedTopics, getTeacherTopics } from '../database/database';

export default function QuizManageScreen() {
	const { colors, isDark } = useTheme();
	const styles = useStyles(colors);
	const [allTopics, setAllTopics] = useState([]);
	const [selected, setSelected] = useState(new Set()); // selected topic names
	const [loading, setLoading] = useState(true);
	const [savedAnim] = useState(new Animated.Value(0));
	const [showSaved, setShowSaved] = useState(false);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			// The only topics a student can choose from are the ones the teacher allowed
			const teacherTopics = await getTeacherTopics();
			const availableTopics = teacherTopics;
			setAllTopics(availableTopics);

			// Load saved selection; if none saved → select all allowed by default
			const topicsFromApi = await getSelectedTopics();
			if (topicsFromApi && topicsFromApi.length > 0) {
				const valid = topicsFromApi.filter(t => availableTopics.includes(t));
				setSelected(new Set(valid));
			} else {
				setSelected(new Set(availableTopics)); 
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
		await setSelectedTopics([...next]);
		flashSaved();
	};

	const selectAll = async () => {
		const next = new Set(allTopics);
		setSelected(next);
		await setSelectedTopics([...next]);
		flashSaved();
	};

	const deselectAll = async () => {
		setSelected(new Set());
		await setSelectedTopics([]);
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
		<LinearGradient colors={isDark ? [colors.background, '#1a1040'] : [colors.background, colors.background] } style={styles.container}>

			{/* Header */}
			<View style={styles.header}>
				<Text style={[styles.title, { color: colors.textPrimary }]}>📋 Themen auswählen</Text>
				<Text style={[styles.subtitle, { color: colors.textMuted }]}>
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
								<View style={[styles.checkbox, { backgroundColor: colors.background, borderColor: colors.border }, isChecked && { borderColor: colors.primary, backgroundColor: colors.primary }]}>
									{isChecked && <Text style={styles.checkmark}>✓</Text>}
								</View>

								{/* Topic icon + name */}
								<View style={[styles.topicIcon, { backgroundColor: colors.primary + '20' }]}>
									<Text style={styles.topicEmoji}>📚</Text>
								</View>
								<Text style={[styles.topicName, { color: colors.textSecondary }, isChecked && { color: colors.textPrimary }]}>
									{name}
								</Text>
							</TouchableOpacity>
						);
					})
				)}
			</ScrollView>

			{/* Saved toast */}
			{showSaved && (
				<Animated.View style={[styles.savedToast, { opacity: savedAnim, backgroundColor: colors.success }]}>
					<Text style={[styles.savedToastText, { color: colors.white }]}>✓ Gespeichert</Text>
				</Animated.View>
			)}
		</LinearGradient>
	);
}

function useStyles(colors) { return StyleSheet.create({
	container: { flex: 1 },

	header: {
		paddingHorizontal: SPACING.xl,
		paddingTop: SPACING.xl,
		paddingBottom: SPACING.md,
	},
	title: {
		fontSize: FONTS.sizes.xxl,
		fontWeight: FONTS.weights.bold,
		color: colors.textPrimary,
		marginBottom: SPACING.xs,
	},
	subtitle: {
		fontSize: FONTS.sizes.sm,
		color: colors.textMuted,
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
		alignItems: 'center',
	},
	bulkBtnActive: {
	},
	bulkBtnDanger: {
	},
	bulkBtnText: {
		fontSize: FONTS.sizes.sm,
		fontWeight: FONTS.weights.medium,
	},
	bulkBtnTextActive: { color: colors.success },
	bulkBtnTextDanger: { color: colors.error },

	listContent: {
		paddingHorizontal: SPACING.xl,
		paddingBottom: SPACING.huge,
	},

	topicRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: RADIUS.lg,
		padding: SPACING.lg,
		marginBottom: SPACING.md,
		borderWidth: 1.5,
		...SHADOWS.sm,
	},
	topicRowChecked: {
	},

	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 6,
		borderWidth: 2,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: SPACING.md,
		flexShrink: 0,
	},
	checkboxChecked: {
	},
	checkmark: {
		fontSize: 14,
		fontWeight: FONTS.weights.bold,
		lineHeight: 16,
	},

	topicIcon: {
		width: 36,
		height: 36,
		borderRadius: RADIUS.md,
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
	},
	topicNameChecked: {
	},

	savedToast: {
		position: 'absolute',
		bottom: SPACING.xxl,
		alignSelf: 'center',
		paddingHorizontal: SPACING.xl,
		paddingVertical: SPACING.sm,
		borderRadius: RADIUS.full,
		...SHADOWS.md,
	},
	savedToastText: {
		fontWeight: FONTS.weights.bold,
		fontSize: FONTS.sizes.sm,
	},
});
}

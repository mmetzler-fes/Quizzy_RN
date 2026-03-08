import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';

export default function ResultsScreen({ answers, onRestart }) {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalCount = answers.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  function getScoreMessage() {
    if (percentage === 100) return { emoji: '🏆', message: 'Perfect Score!', color: '#F1C40F' };
    if (percentage >= 80) return { emoji: '🎉', message: 'Excellent!', color: '#2ECC71' };
    if (percentage >= 60) return { emoji: '👍', message: 'Good Job!', color: '#4A90E2' };
    if (percentage >= 40) return { emoji: '📚', message: 'Keep Practicing!', color: '#E67E22' };
    return { emoji: '💪', message: 'Try Again!', color: '#E74C3C' };
  }

  const scoreInfo = getScoreMessage();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      <View style={[styles.header, { backgroundColor: scoreInfo.color }]}>
        <Text style={styles.headerEmoji}>{scoreInfo.emoji}</Text>
        <Text style={styles.headerMessage}>{scoreInfo.message}</Text>
        <Text style={styles.scoreText}>
          {correctCount} / {totalCount}
        </Text>
        <Text style={styles.percentageText}>{percentage}%</Text>
      </View>

      <ScrollView style={styles.answersContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.reviewTitle}>Review Your Answers</Text>
        {answers.map((answer, index) => (
          <View key={index} style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Text style={styles.answerNumber}>Q{index + 1}</Text>
              <Text style={answer.isCorrect ? styles.correctBadge : styles.wrongBadge}>
                {answer.isCorrect ? '✓ Correct' : '✗ Wrong'}
              </Text>
            </View>
            <Text style={styles.questionText}>{answer.question}</Text>
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Your answer: </Text>
              <Text
                style={[
                  styles.answerValue,
                  answer.isCorrect ? styles.correctText : styles.wrongText,
                ]}
              >
                {answer.selectedAnswer || 'No answer'}
              </Text>
            </View>
            {!answer.isCorrect && (
              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Correct answer: </Text>
                <Text style={[styles.answerValue, styles.correctText]}>{answer.correctAnswer}</Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.restartButton} onPress={onRestart} activeOpacity={0.8}>
          <Text style={styles.restartButtonText}>🔄  Play Again</Text>
        </TouchableOpacity>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    paddingTop: 30,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  headerMessage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 56,
  },
  percentageText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  answersContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginTop: 20,
    marginBottom: 12,
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#999',
  },
  correctBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2ECC71',
  },
  wrongBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E74C3C',
  },
  questionText: {
    fontSize: 15,
    color: '#1A1A2E',
    fontWeight: '500',
    marginBottom: 10,
    lineHeight: 22,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  answerLabel: {
    fontSize: 14,
    color: '#666',
  },
  answerValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  correctText: {
    color: '#2ECC71',
  },
  wrongText: {
    color: '#E74C3C',
  },
  restartButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  restartButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 20,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizScreen({ questions, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = (currentIndex + 1) / questions.length;

  function handleSelectOption(option) {
    if (selectedOption !== null) return;
    setSelectedOption(option);
  }

  function handleNext() {
    const updatedAnswers = [
      ...answers,
      {
        question: currentQuestion.question,
        selectedAnswer: selectedOption,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: selectedOption === currentQuestion.correctAnswer,
      },
    ];

    if (isLastQuestion) {
      onFinish(updatedAnswers);
    } else {
      setAnswers(updatedAnswers);
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
    }
  }

  function getOptionStyle(option) {
    if (selectedOption === null) {
      return styles.optionButton;
    }
    if (option === currentQuestion.correctAnswer) {
      return [styles.optionButton, styles.optionCorrect];
    }
    if (option === selectedOption && option !== currentQuestion.correctAnswer) {
      return [styles.optionButton, styles.optionWrong];
    }
    return [styles.optionButton, styles.optionDisabled];
  }

  function getOptionTextStyle(option) {
    if (selectedOption === null) {
      return styles.optionText;
    }
    if (option === currentQuestion.correctAnswer) {
      return [styles.optionText, styles.optionTextSelected];
    }
    if (option === selectedOption && option !== currentQuestion.correctAnswer) {
      return [styles.optionText, styles.optionTextSelected];
    }
    return [styles.optionText, styles.optionTextDisabled];
  }

  function getLabelStyle(option) {
    if (selectedOption === null) {
      return styles.optionLabel;
    }
    if (option === currentQuestion.correctAnswer || option === selectedOption) {
      return [styles.optionLabel, styles.optionLabelSelected];
    }
    return [styles.optionLabel, styles.optionLabelDisabled];
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FF" />

      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <Text style={styles.questionCounter}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{currentQuestion.category}</Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={option}
            style={getOptionStyle(option)}
            onPress={() => handleSelectOption(option)}
            activeOpacity={selectedOption !== null ? 1 : 0.7}
          >
            <View style={getLabelStyle(option)}>
              <Text style={styles.optionLabelText}>{OPTION_LABELS[index]}</Text>
            </View>
            <Text style={getOptionTextStyle(option)}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedOption !== null && (
        <View style={styles.footer}>
          <View
            style={[
              styles.feedbackBanner,
              selectedOption === currentQuestion.correctAnswer
                ? styles.feedbackCorrect
                : styles.feedbackWrong,
            ]}
          >
            <Text style={styles.feedbackEmoji}>
              {selectedOption === currentQuestion.correctAnswer ? '🎉' : '❌'}
            </Text>
            <Text style={styles.feedbackText}>
              {selectedOption === currentQuestion.correctAnswer
                ? 'Correct!'
                : `Correct answer: ${currentQuestion.correctAnswer}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'See Results' : 'Next Question'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionCounter: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E7FF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  questionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A2E',
    lineHeight: 32,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E8EAFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCorrect: {
    backgroundColor: '#E8F8F0',
    borderColor: '#2ECC71',
  },
  optionWrong: {
    backgroundColor: '#FEE8E8',
    borderColor: '#E74C3C',
  },
  optionDisabled: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E8EAFF',
    opacity: 0.6,
  },
  optionLabel: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionLabelSelected: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  optionLabelDisabled: {
    backgroundColor: '#F0F0F0',
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A2E',
    flex: 1,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#1A1A2E',
  },
  optionTextDisabled: {
    color: '#999',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  feedbackCorrect: {
    backgroundColor: '#E8F8F0',
  },
  feedbackWrong: {
    backgroundColor: '#FEE8E8',
  },
  feedbackEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

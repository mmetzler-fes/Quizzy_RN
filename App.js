import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import questions from './src/data/questions';

const SCREENS = {
  HOME: 'HOME',
  QUIZ: 'QUIZ',
  RESULTS: 'RESULTS',
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.HOME);
  const [answers, setAnswers] = useState([]);

  function handleStart() {
    setCurrentScreen(SCREENS.QUIZ);
    setAnswers([]);
  }

  function handleFinish(finalAnswers) {
    setAnswers(finalAnswers);
    setCurrentScreen(SCREENS.RESULTS);
  }

  function handleRestart() {
    setCurrentScreen(SCREENS.HOME);
    setAnswers([]);
  }

  if (currentScreen === SCREENS.HOME) {
    return <HomeScreen onStart={handleStart} />;
  }

  if (currentScreen === SCREENS.QUIZ) {
    return <QuizScreen questions={questions} onFinish={handleFinish} />;
  }

  return <ResultsScreen answers={answers} onRestart={handleRestart} />;
}

# Quizzy 🧠

A fun and interactive quiz app built with React Native (Expo).

## Features

- 10 questions across multiple categories (Geography, Science, Art, Math, History, Technology, Biology)
- Instant feedback after each answer (correct/incorrect highlighted)
- Progress bar to track your quiz progress
- Results screen with score, percentage, and answer review
- Play again to retake the quiz

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your mobile device (optional)

### Installation

```bash
npm install
```

### Running the App

```bash
# Start the Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## App Structure

```
src/
  screens/
    HomeScreen.js     - Welcome screen with app stats and start button
    QuizScreen.js     - Quiz questions with answer options and feedback
    ResultsScreen.js  - Score display with answer review
  data/
    questions.js      - Quiz questions data
```

## Screenshots

The app consists of three main screens:

1. **Home Screen** – Displays the app logo, stats (questions, categories), and a "Start Quiz" button
2. **Quiz Screen** – Shows each question with four answer options, highlights correct/wrong answers, and tracks progress
3. **Results Screen** – Shows score, percentage, a motivational message, and a detailed review of all answers

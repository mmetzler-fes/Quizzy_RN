import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../styles/theme';

const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => {},
  colors: darkColors,
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // Default to dark

  useEffect(() => {
    // Load saved theme preference on start
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('quizzyTheme');
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newDarkState = !isDark;
      setIsDark(newDarkState);
      await AsyncStorage.setItem('quizzyTheme', newDarkState ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

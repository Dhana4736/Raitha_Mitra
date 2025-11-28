import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Image, SafeAreaView } from 'react-native';

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Image 
        source={require('../assets/splash-icon.png')} 
        style={styles.splashImage}
        // This describes the image to screen readers
        accessibilityLabel="RaithaMitra App Logo" 
      />

      <Text 
        style={styles.splashText}
        // This helps the screen reader announce the text in a logical group
        accessibilityRole="header" 
      >
        Welcome to
      </Text>
      <Text 
        style={styles.splashTextBrand}
        accessibilityRole="header"
      >
        RaithaMitra
      </Text>
      <ActivityIndicator size="large" color="#006400" style={{ marginTop: 20 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 30,
    borderRadius: 100,
  },
  splashText: {
    fontSize: 28,
    color: '#4A4A4A',
    fontWeight: '300',
  },
  splashTextBrand: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#006400',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
});


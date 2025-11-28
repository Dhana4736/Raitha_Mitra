import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Helper to map WMO weather codes to icons and descriptions
const getWeatherDetails = (code) => {
    const mapping = {
        0: { label: 'Clear Sky', icon: 'weather-sunny', color: '#FFD700' },
        1: { label: 'Mainly Clear', icon: 'weather-sunny', color: '#FFD700' },
        2: { label: 'Partly Cloudy', icon: 'weather-partly-cloudy', color: '#A9A9A9' },
        3: { label: 'Overcast', icon: 'weather-cloudy', color: '#778899' },
        45: { label: 'Fog', icon: 'weather-fog', color: '#C0C0C0' },
        48: { label: 'Depositing Rime Fog', icon: 'weather-fog', color: '#C0C0C0' },
        51: { label: 'Light Drizzle', icon: 'weather-partly-rainy', color: '#87CEEB' },
        53: { label: 'Moderate Drizzle', icon: 'weather-rainy', color: '#87CEEB' },
        55: { label: 'Dense Drizzle', icon: 'weather-pouring', color: '#4682B4' },
        61: { label: 'Slight Rain', icon: 'weather-rainy', color: '#4682B4' },
        63: { label: 'Moderate Rain', icon: 'weather-pouring', color: '#4169E1' },
        65: { label: 'Heavy Rain', icon: 'weather-lightning-rainy', color: '#00008B' },
        71: { label: 'Slight Snow', icon: 'weather-snowy', color: '#E0FFFF' },
        73: { label: 'Moderate Snow', icon: 'weather-snowy-heavy', color: '#E0FFFF' },
        95: { label: 'Thunderstorm', icon: 'weather-lightning', color: '#FF4500' },
    };
    return mapping[code] || { label: 'Unknown', icon: 'weather-cloudy', color: 'gray' };
};

export default function WeatherScreen() {
    const [location, setLocation] = useState(null);
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                setLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            fetchWeatherData(loc.coords.latitude, loc.coords.longitude);
        })();
    }, []);

    const fetchWeatherData = async (lat, lon) => {
        try {
            // Using Open-Meteo API (Free, No Key required)
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
            );
            const data = await response.json();
            setWeather(data);
        } catch (error) {
            console.error(error);
            setErrorMsg("Failed to fetch weather data.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2E8B57" />
                <Text style={styles.loadingText}>Fetching local weather...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={styles.centered}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="red" />
                <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
        );
    }

    const currentDetails = getWeatherDetails(weather?.current_weather?.weathercode);

    return (
        <SafeAreaView style={styles.container}>
            {/* Current Weather Card */}
            <View style={[styles.currentCard, { backgroundColor: '#E0F7FA' }]}>
                <Text style={styles.cityTitle}>Current Location</Text>
                <View style={styles.row}>
                    <MaterialCommunityIcons name={currentDetails.icon} size={80} color={currentDetails.color} />
                    <View>
                        <Text style={styles.temperature}>{weather?.current_weather?.temperature}°C</Text>
                        <Text style={styles.condition}>{currentDetails.label}</Text>
                    </View>
                </View>
                <View style={styles.extraInfo}>
                    <View style={styles.infoItem}>
                        <MaterialCommunityIcons name="weather-windy" size={24} color="#555" />
                        <Text>{weather?.current_weather?.windspeed} km/h</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>7-Day Forecast</Text>

            {/* Weekly Forecast List */}
            <FlatList
                data={weather?.daily?.time}
                keyExtractor={(item) => item}
                renderItem={({ item, index }) => {
                    // Note: Open-Meteo daily weather codes might not align perfectly line-by-line in free tier arrays, 
                    // but for simplicity, we assume the daily array indices match.
                    // We only have current_weather code, so we use a generic sun/cloud for future days 
                    // unless we parse the detailed hourly codes.
                    return (
                        <View style={styles.forecastItem}>
                            <Text style={styles.forecastDate}>{item}</Text>
                            <View style={styles.forecastTemp}>
                                <Text style={styles.maxTemp}>{weather.daily.temperature_2m_max[index]}°</Text>
                                <Text style={styles.minTemp}>{weather.daily.temperature_2m_min[index]}°</Text>
                            </View>
                             <View style={styles.forecastRain}>
                                <MaterialCommunityIcons name="water-outline" size={16} color="#4682B4" />
                                <Text>{weather.daily.precipitation_sum[index]}mm</Text>
                            </View>
                        </View>
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
    errorText: { marginTop: 10, fontSize: 16, color: 'red' },
    currentCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        alignItems: 'center',
        elevation: 4,
    },
    cityTitle: { fontSize: 18, color: '#555', marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-around' },
    temperature: { fontSize: 48, fontWeight: 'bold', color: '#333' },
    condition: { fontSize: 20, color: '#555', marginTop: 5 },
    extraInfo: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-around', width: '100%' },
    infoItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    forecastItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    forecastDate: { fontSize: 16, fontWeight: '600', color: '#333', width: 100 },
    forecastTemp: { flexDirection: 'row', gap: 15 },
    maxTemp: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    minTemp: { fontSize: 16, color: '#888' },
    forecastRain: { flexDirection: 'row', alignItems: 'center', gap: 5, width: 60, justifyContent: 'flex-end' },
});
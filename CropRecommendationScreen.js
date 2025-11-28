import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const CROP_DATABASE = [
    {
        id: '1',
        name: 'Wheat',
        minTemp: 10,
        maxTemp: 25,
        season: 'Winter',
        description: 'Major staple crop. Requires cool weather for growth and warm for ripening.',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
    },
    {
        
        id: '2',
        name: 'Barley',
        minTemp: 12,
        maxTemp: 25,
        season: 'Winter',
        description: 'Hardy cereal grain. Grows well in cool conditions.',
        image: 'https://images.unsplash.com/photo-1437252611977-07f74518abd7?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },

    {
        id: '3',
        name: 'Oats',
        minTemp: 10,
        maxTemp: 20,
        season: 'Winter',
        description: 'Requires cool and moist climate.',
        image: 'https://plus.unsplash.com/premium_photo-1671130295244-b058fc8d86fe?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '4',
        name: 'Spinach',
        minTemp: 10,
        maxTemp: 22,
        season: 'Winter',
        description: 'Leafy green, grows fast in cool weather.',
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80',
    },
    {
        id: '5',
        name: 'Cauliflower',
        minTemp: 15,
        maxTemp: 25,
        season: 'Winter',
        description: 'Needs cool climate for head formation.',
        image: 'https://images.unsplash.com/photo-1638901592594-04adaef61b80?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '6',
        name: 'Cabbage',
        minTemp: 15,
        maxTemp: 20,
        season: 'Winter',
        description: 'Cool season leafy vegetable.',
        image: 'https://images.unsplash.com/photo-1652860213441-6622f9fec77f?q=80&w=1746&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '7',
        name: 'Broccoli',
        minTemp: 14,
        maxTemp: 22,
        season: 'Winter',
        description: 'Thrives in cool weather.',
        image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80',
    },
    {
        id: '8',
        name: 'Peas',
        minTemp: 13,
        maxTemp: 23,
        season: 'Winter',
        description: 'Legume crop, sensitive to heat.',
        image: 'https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=600&q=80',
    },
    {
        id: '9',
        name: 'Carrot',
        minTemp: 15,
        maxTemp: 20,
        season: 'Winter',
        description: 'Root vegetable, needs cool soil.',
        image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80',
    },
    {
        id: '10',
        name: 'Radish',
        minTemp: 10,
        maxTemp: 18,
        season: 'Winter',
        description: 'Fast growing root vegetable.',
        image: 'https://images.unsplash.com/photo-1585369496178-144fd937f249?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '11',
        name: 'Mustard',
        minTemp: 10,
        maxTemp: 25,
        season: 'Winter',
        description: 'Oilseed crop, needs cool climate.',
        image: 'https://images.unsplash.com/photo-1701188543419-f2e932565056?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '12',
        name: 'Chickpea (Gram)',
        minTemp: 20,
        maxTemp: 30,
        season: 'Winter',
        description: 'Important pulse crop.',
        image: 'https://images.unsplash.com/photo-1724418020207-144b3ba54d2d?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
     {
        id: '13',
        name: 'Potato',
        minTemp: 15,
        maxTemp: 25,
        season: 'Winter',
        description: 'Tuber crop, needs cool nights.',
        image: 'https://plus.unsplash.com/premium_photo-1681826785868-7325c8f0e416?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '14',
        name: 'Strawberry',
        minTemp: 15,
        maxTemp: 26,
        season: 'Winter',
        description: 'Fruit crop, needs cool climate.',
        image: 'https://images.unsplash.com/photo-1594282241894-4da286138f44?q=80&w=1734&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '15',
        name: 'Garlic',
        minTemp: 12,
        maxTemp: 24,
        season: 'Winter',
        description: 'Bulb crop, long growing season.',
        image: 'https://images.unsplash.com/photo-1665913063161-51022aa527d1?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },

    // --- Warm Season Crops (20°C - 30°C) ---
    {
        id: '16',
        name: 'Rice (Paddy)',
        minTemp: 20,
        maxTemp: 35,
        season: 'Monsoon',
        description: 'High water requirement. Best for humid climates.',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    },
    {
        id: '17',
        name: 'Maize (Corn)',
        minTemp: 21,
        maxTemp: 30,
        season: 'Kharif',
        description: 'Versatile cereal crop.',
        image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80',
    },
    {
        id: '18',
        name: 'Ragi (Finger Millet)',
        minTemp: 20,
        maxTemp: 30,
        season: 'Kharif',
        description: 'Drought resistant. Good for dry lands.',
        image: 'https://images.unsplash.com/photo-1653580524515-77b19c176b88?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '22',
        name: 'Soybean',
        minTemp: 20,
        maxTemp: 30,
        season: 'Kharif',
        description: 'Protein-rich legume.',
        image: 'https://media.istockphoto.com/id/1400438871/photo/pear-millet-background.jpg?s=612x612&w=0&k=20&c=0GlBeceuX9Q_AZ0-CH57_A5s7_tD769N2f_jrbNcbrw=',
    },
    {
        id: '23',
        name: 'Cotton',
        minTemp: 21,
        maxTemp: 30,
        season: 'Kharif',
        description: 'Fiber crop, requires plenty of sunshine.',
        image: 'https://images.unsplash.com/photo-1634337781106-4c6a12b820a1?q=80&w=898&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '24',
        name: 'Sugarcane',
        minTemp: 20,
        maxTemp: 35,
        season: 'Annual',
        description: 'Long duration, high water needs.',
        image: 'https://m.media-amazon.com/images/I/71QwGr-S7VL.jpg',
    },
    {
        id: '25',
        name: 'Tomato',
        minTemp: 18,
        maxTemp: 28,
        season: 'All',
        description: 'Versatile vegetable.',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80',
    },
    {
        id: '26',
        name: 'Brinjal (Eggplant)',
        minTemp: 20,
        maxTemp: 30,
        season: 'All',
        description: 'Warm season vegetable.',
        image: 'https://images.unsplash.com/photo-1730202452902-3b0fa8d96536?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '27',
        name: 'Chilli',
        minTemp: 20,
        maxTemp: 30,
        season: 'All',
        description: 'Spice crop, needs warm humid climate.',
        image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&q=80',
    },
    {
        id: '28',
        name: 'Okra (Lady Finger)',
        minTemp: 22,
        maxTemp: 35,
        season: 'Summer',
        description: 'Thrives in hot weather.',
        image: 'https://images.unsplash.com/photo-1664289242854-e99d345cfa92?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '29',
        name: 'Turmeric',
        minTemp: 20,
        maxTemp: 30,
        season: 'Annual',
        description: 'Spice, needs warm climate.',
        image: 'https://images.unsplash.com/photo-1666818398897-381dd5eb9139?q=80&w=1748&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
     {
        id: '30',
        name: 'Ginger',
        minTemp: 19,
        maxTemp: 28,
        season: 'Annual',
        description: 'Needs warm and humid climate.',
        image: 'https://images.unsplash.com/photo-1573414405995-2012861b74e0?q=80&w=1752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '31',
        name: 'Papaya',
        minTemp: 21,
        maxTemp: 33,
        season: 'Perennial',
        description: 'Tropical fruit crop.',
        image: 'https://plus.unsplash.com/premium_photo-1723291762610-738d25fbe883?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '32',
        name: 'Banana',
        minTemp: 15,
        maxTemp: 35,
        season: 'Perennial',
        description: 'High water and heat requirement.',
        image: 'https://images.unsplash.com/photo-1635847352976-23665317e134?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '35',
        name: 'Cucumber',
        minTemp: 20,
        maxTemp: 35,
        season: 'Summer',
        description: 'Fast growing vine crop.',
        image: 'https://images.unsplash.com/photo-1694153192731-ab5445654427?q=80&w=918&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '36',
        name: 'Pumpkin',
        minTemp: 20,
        maxTemp: 35,
        season: 'Summer',
        description: 'Warm season vegetable.',
        image: 'https://images.unsplash.com/photo-1728761941712-9f531f5926b7?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '37',
        name: 'Bitter Gourd',
        minTemp: 25,
        maxTemp: 35,
        season: 'Summer',
        description: 'Medicinal vegetable.',
        image: 'https://images.unsplash.com/photo-1588391453522-a8b470845269?q=80&w=3026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '39',
        name: 'Sunflower',
        minTemp: 20,
        maxTemp: 30,
        season: 'Summer',
        description: 'Drought tolerant oilseed.',
        image: 'https://plus.unsplash.com/premium_photo-1700124162812-1d5d29087b81?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        id: '42',
        name: 'Mango',
        minTemp: 24,
        maxTemp: 35,
        season: 'Perennial',
        description: 'King of fruits, needs dry summer.',
        image: 'https://c.ndtvimg.com/2025-04/g8bj8qu8_mango-news_650x400_30_April_25.jpg?im=FeatureCrop,algorithm=dnn,width=1200,height=738',
    },

    // --- Others / Plantation Crops ---
    {
        id: '43',
        name: 'Coffee (Arabica)',
        minTemp: 15,
        maxTemp: 25,
        season: 'Perennial',
        description: 'Hill crop, needs shade.',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1rToKsVXX9l-xseGIVvqbrKy7-prl4USnuA&s',
    },
    {
        id: '45',
        name: 'Tea',
        minTemp: 13,
        maxTemp: 30,
        season: 'Perennial',
        description: 'Hill crop, high rainfall.',
        image: 'https://www.octavius.in/cdn/shop/articles/The_journey_of_a_tea_leaf_From_farm_to_cup.jpg?v=1693027986',
    },
    {
        id: '46',
        name: 'Arecanut',
        minTemp: 14,
        maxTemp: 36,
        season: 'Perennial',
        description: 'Plantation crop.',
        image: 'https://spiisry.in/wp-content/uploads/2023/06/image.webp',
    },
    {
        id: '47',
        name: 'Coconut',
        minTemp: 20,
        maxTemp: 32,
        season: 'Perennial',
        description: 'Coastal and tropical crop.',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROaBzo20X4Mxl9ND3qq2O7Wl3C7TttIaN3Dw&s',
    },
    {
        id: '48',
        name: 'Pepper',
        minTemp: 10,
        maxTemp: 40,
        season: 'Perennial',
        description: 'Spice, grown as intercrop.',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfbWXj8cgLzHshmHl0IBUNks4sFX9HwCXWkQ&s',
    },
    {
        id: '49',
        name: 'Rubber',
        minTemp: 20,
        maxTemp: 30,
        season: 'Perennial',
        description: 'Industrial crop.',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfbWXj8cgLzHshmHl0IBUNks4sFX9HwCXWkQ&s', // Reusing placeholder
    },
    {
        id: '50',
        name: 'Cardamom',
        minTemp: 10,
        maxTemp: 35,
        season: 'Perennial',
        description: 'Queen of spices.',
        image: 'https://www.greendna.in/cdn/shop/products/Cardamom_640x.png?v=1560959843',
    }
     
];

export default function CropRecommendationScreen() {
    const [loading, setLoading] = useState(true);
    const [currentWeather, setCurrentWeather] = useState(null);
    const [recommendedCrops, setRecommendedCrops] = useState([]);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access location was denied');
                setLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            fetchLocalWeather(loc.coords.latitude, loc.coords.longitude);
        })();
    }, []);

    const fetchLocalWeather = async (lat, lon) => {
        try {
            // Using Open-Meteo to get current temp
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );
            const data = await response.json();
            const temp = data.current_weather.temperature;
            
            setCurrentWeather(temp);
            generateRecommendations(temp);
        } catch (error) {
            console.error(error);
            alert("Failed to analyze climate conditions.");
        } finally {
            setLoading(false);
        }
    };

    const generateRecommendations = (temp) => {
        // Simple logic: Filter crops where current temp is within their optimal range
        // We allow a buffer of +/- 5 degrees to be generous
        const suitable = CROP_DATABASE.filter(crop => {
            return temp >= (crop.minTemp - 5) && temp <= (crop.maxTemp + 5);
        });
        setRecommendedCrops(suitable);
    };

    const renderCropItem = ({ item }) => (
        <View style={styles.card}>
            <Image 
                source={{ uri: item.image }} 
                style={styles.cardImage} 
                resizeMode="cover" // Ensures image fills the space nicely
            />
            <View style={styles.cardContent}>
                <Text style={styles.cropName}>{item.name}</Text>
                <View style={styles.tagContainer}>
                    <View style={styles.tag}>
                        <MaterialCommunityIcons name="thermometer" size={14} color="#fff" />
                        <Text style={styles.tagText}>{item.minTemp}-{item.maxTemp}°C</Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: '#FFA500' }]}>
                        <MaterialCommunityIcons name="weather-sunny" size={14} color="#fff" />
                        <Text style={styles.tagText}>{item.season}</Text>
                    </View>
                </View>
                <Text style={styles.description}>{item.description}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2E8B57" />
                <Text style={styles.loadingText}>Analyzing soil & climate data...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Smart Suggestions</Text>
                <Text style={styles.weatherSummary}>
                    Current Temp: <Text style={{ fontWeight: 'bold', color: '#2E8B57' }}>{currentWeather}°C</Text>
                </Text>
            </View>

            <FlatList
                data={recommendedCrops}
                keyExtractor={item => item.id}
                renderItem={renderCropItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="sprout-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No specific crops match exact current conditions.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 16, color: '#555' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    weatherSummary: { fontSize: 16, color: '#555', marginTop: 5 },
    listContainer: { padding: 15 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardImage: { width: '100%', height: 180, backgroundColor: '#e0e0e0' }, // Added background color for loading state
    cardContent: { padding: 15 },
    cropName: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    tagContainer: { flexDirection: 'row', marginBottom: 10, gap: 10 },
    tag: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#2E8B57', 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 20,
        gap: 4
    },
    tagText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    description: { fontSize: 14, color: '#666', lineHeight: 20 },
    emptyContainer: { padding: 20, alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 10, fontSize: 16, color: 'gray', textAlign: 'center' }
});
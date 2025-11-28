import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock Data for Transporters
const TRANSPORTERS = [
    {
        id: '1',
        provider: 'Raju Transports',
        vehicle: 'Tata Ace (Chota Hathi)',
        capacity: '750 kg',
        price: '₹25/km',
        rating: 4.8,
        phone: '9876543210',
        location: 'Mysore Road, Bangalore',
        image: 'https://www.geotab.com/CMS-Media-production/Blog/NA/2025/July/future-transportation/future-of-transportation-hero.jpg',
    },
    {
        id: '2',
        provider: 'Green Logistics',
        vehicle: 'Mahindra Bolero Pickup',
        capacity: '1.5 Tons',
        price: '₹40/km',
        rating: 4.5,
        phone: '9876543211',
        location: 'Kolar Highway',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Mahindra_Bolero_Camper.jpg/640px-Mahindra_Bolero_Camper.jpg',
    },
    {
        id: '3',
        provider: 'Heavy Haulers Co.',
        vehicle: 'Eicher Pro (Lorry)',
        capacity: '5 Tons',
        price: '₹80/km',
        rating: 4.2,
        phone: '9876543212',
        location: 'Tumkur',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Eicher_Pro_1000.jpg/640px-Eicher_Pro_1000.jpg',
    },
];

export default function LogisticsScreen() {
    const handleCall = (phone) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleBook = (item) => {
        Alert.alert(
            "Confirm Booking",
            `Request ${item.vehicle} from ${item.provider}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Book Now", onPress: () => Alert.alert("Success", "Transport request sent! The driver will contact you shortly.") }
            ]
        );
    };

    const renderTransporter = ({ item }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                    <Text style={styles.providerName}>{item.provider}</Text>
                    <View style={styles.ratingContainer}>
                        <Octicons name="star-fill" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                </View>
                <Text style={styles.vehicleName}>{item.vehicle}</Text>
                <Text style={styles.location}><Octicons name="location" size={14} /> {item.location}</Text>

                <View style={styles.detailsRow}>
                    <View style={styles.badge}>
                        <MaterialCommunityIcons name="weight" size={16} color="#555" />
                        <Text style={styles.badgeText}>{item.capacity}</Text>
                    </View>
                    <View style={styles.badge}>
                        <MaterialCommunityIcons name="cash" size={16} color="#555" />
                        <Text style={styles.badgeText}>{item.price}</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item.phone)}>
                        <MaterialCommunityIcons name="phone" size={20} color="#2E8B57" />
                        <Text style={styles.callButtonText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bookButton} onPress={() => handleBook(item)}>
                        <Text style={styles.bookButtonText}>Book Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Transport Logistics</Text>
                <Text style={styles.subHeader}>Find vehicles to move your harvest</Text>
            </View>
            <FlatList
                data={TRANSPORTERS}
                keyExtractor={item => item.id}
                renderItem={renderTransporter}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2E8B57' },
    subHeader: { fontSize: 14, color: '#666', marginTop: 4 },
    list: { padding: 15 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
    },
    cardImage: { width: '100%', height: 160 },
    cardContent: { padding: 15 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    providerName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF9C4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    ratingText: { fontSize: 14, fontWeight: 'bold', color: '#F57F17' },
    vehicleName: { fontSize: 16, color: '#555', marginTop: 4 },
    location: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 12 },
    detailsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, gap: 6 },
    badgeText: { fontSize: 14, color: '#333', fontWeight: '500' },
    actionRow: { flexDirection: 'row', gap: 10 },
    callButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E8B57', borderRadius: 8, paddingVertical: 10, gap: 8 },
    callButtonText: { color: '#2E8B57', fontSize: 16, fontWeight: 'bold' },
    bookButton: { flex: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2E8B57', borderRadius: 8, paddingVertical: 10 },
    bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock Data for Community Requests
const COMMUNITY_REQUESTS = [
    {
        id: '1',
        title: 'Bulk Order: Organic Tomatoes',
        requester: 'Bangalore Co-op Society',
        quantity: '500 kg',
        price: '₹15/kg',
        deadline: '2 days left',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/640px-Tomato_je.jpg',
    },
    {
        id: '2',
        title: 'Looking for Fresh Spinach',
        requester: 'Green Leaf Restaurant Chain',
        quantity: '100 kg',
        price: '₹40/kg',
        deadline: 'Urgent',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Spinach.jpg/640px-Spinach.jpg',
    },
    {
        id: '3',
        title: 'Potato Supply for Chips Factory',
        requester: 'SnackTime Industries',
        quantity: '2000 kg',
        price: '₹22/kg',
        deadline: '1 week left',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/640px-Patates.jpg',
    },
];

export default function CommunityBasketScreen() {
    const [requests, setRequests] = useState(COMMUNITY_REQUESTS);

    const handleAccept = (item) => {
        Alert.alert(
            "Express Interest",
            `Do you want to supply for "${item.title}"? The requester will be notified.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", onPress: () => Alert.alert("Success", "Your interest has been sent!") }
            ]
        );
    };

    const renderRequestItem = ({ item }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.requester}>By: {item.requester}</Text>
                
                <View style={styles.detailsRow}>
                    <View style={styles.detailBadge}>
                        <MaterialCommunityIcons name="weight-kilogram" size={16} color="#555" />
                        <Text style={styles.detailText}>{item.quantity}</Text>
                    </View>
                    <View style={styles.detailBadge}>
                        <MaterialCommunityIcons name="currency-inr" size={16} color="#555" />
                        <Text style={styles.detailText}>{item.price}</Text>
                    </View>
                    <View style={[styles.detailBadge, { backgroundColor: '#FFE0E0' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#B22222" />
                        <Text style={[styles.detailText, { color: '#B22222' }]}>{item.deadline}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.actionButton} onPress={() => handleAccept(item)}>
                    <Text style={styles.actionButtonText}>I Can Supply</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Community Basket</Text>
                <Text style={styles.subHeader}>Bulk orders & cooperative requests</Text>
            </View>
            <FlatList
                data={requests}
                keyExtractor={item => item.id}
                renderItem={renderRequestItem}
                contentContainerStyle={styles.listContainer}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2E8B57' },
    subHeader: { fontSize: 14, color: '#777', marginTop: 4 },
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
    cardImage: { width: '100%', height: 150 },
    cardContent: { padding: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    requester: { fontSize: 14, color: '#555', marginBottom: 12, fontStyle: 'italic' },
    detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
    detailBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F0F0F0', 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 8,
        gap: 5
    },
    detailText: { fontSize: 14, fontWeight: '600', color: '#333' },
    actionButton: {
        backgroundColor: '#2E8B57',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
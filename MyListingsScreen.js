import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Import path is CORRECT here
import { auth, db } from '../firebaseconfig';

// A component to render each product card with an Edit button
const ProductCard = ({ item }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardPrice}>₹{item.price.toFixed(2)} / kg</Text>
                <Text style={styles.cardQuantity}>Available: {item.quantity}</Text>
            </View>
            {/* This is the Edit button that navigates to the EditProductScreen */}
            <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => navigation.navigate('EditProduct', { product: item })}
            >
                <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function MyListingsScreen() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Safety check: Ensure user is logged in
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        // This query fetches only the products listed by the current farmer
        const q = query(
            collection(db, "products"),
            where("farmerId", "==", auth.currentUser.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const productsData = [];
            querySnapshot.forEach((doc) => {
                productsData.push({ ...doc.data(), id: doc.id });
            });
            setListings(productsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching listings: ", err);
            setError("There was a problem fetching your listings.");
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, []);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#2E8B57" /></View>;
    }
    
    if (error) {
        return <View style={styles.centered}><Text>{error}</Text></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Listings</Text>
            </View>
            <FlatList
                data={listings}
                renderItem={({ item }) => <ProductCard item={item} />}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.container}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>You haven't listed any products yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    container: { padding: 15 },
    emptyText: { fontSize: 16, color: 'gray' },
    // Card Styles
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    cardImage: { width: '100%', height: 180 },
    cardContent: { padding: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardPrice: { fontSize: 16, color: '#2E8B57', marginVertical: 5 },
    cardQuantity: { fontSize: 14, color: 'gray' },
    editButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5,
    },
});
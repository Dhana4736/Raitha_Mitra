import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseconfig';

export default function UserFeedbacksScreen() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;

        // Query feedbacks where the current user is the Farmer
        const q = query(
            collection(db, "feedbacks"),
            where("farmerId", "==", auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
            
            // Sort by date manually
            data.sort((a, b) => b.createdAt - a.createdAt);
            
            setFeedbacks(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <MaterialCommunityIcons 
                    key={i} 
                    name={i <= rating ? "star" : "star-outline"} 
                    size={18} 
                    color="#FFA500" 
                />
            );
        }
        return <View style={styles.starContainer}>{stars}</View>;
    };

    const renderFeedbackItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Image 
                    source={item.productImageUrl ? { uri: item.productImageUrl } : require('../assets/splash-icon.png')} 
                    style={styles.productImage} 
                />
                <View style={styles.headerText}>
                    <Text style={styles.productName}>{item.productName}</Text>
                    <Text style={styles.customerName}>by {item.customerName || "Customer"}</Text>
                    <Text style={styles.date}>{item.createdAt?.toLocaleDateString()}</Text>
                </View>
                <View style={styles.ratingBox}>
                     <Text style={styles.ratingNumber}>{item.rating}.0</Text>
                     {renderStars(item.rating)}
                </View>
            </View>
            {item.review ? (
                <View style={styles.reviewContainer}>
                    <MaterialCommunityIcons name="format-quote-open" size={20} color="#ccc" style={styles.quoteIcon} />
                    <Text style={styles.reviewText}>{item.review}</Text>
                </View>
            ) : null}
        </View>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#2E8B57" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={feedbacks}
                keyExtractor={item => item.id}
                renderItem={renderFeedbackItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="comment-text-outline" size={60} color="#ddd" />
                        <Text style={styles.emptyText}>No feedbacks yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 15 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        padding: 15,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    header: { flexDirection: 'row', marginBottom: 10 },
    productImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#f0f0f0' },
    headerText: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    productName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    customerName: { fontSize: 12, color: '#666' },
    date: { fontSize: 12, color: '#999', marginTop: 2 },
    ratingBox: { alignItems: 'flex-end', justifyContent: 'center' },
    ratingNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    starContainer: { flexDirection: 'row' },
    reviewContainer: { 
        backgroundColor: '#F9F9F9', 
        padding: 10, 
        borderRadius: 8, 
        marginTop: 5,
        flexDirection: 'row' 
    },
    quoteIcon: { marginRight: 5, marginTop: -2 },
    reviewText: { flex: 1, fontSize: 14, color: '#555', fontStyle: 'italic', lineHeight: 20 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 10, fontSize: 16, color: 'gray' },
});
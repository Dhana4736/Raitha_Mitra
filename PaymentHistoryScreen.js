import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseconfig';

export default function PaymentHistoryScreen() {
    const [payments, setPayments] = useState([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;

        // Query for orders involving this farmer that are 'accepted' (treated as paid/completed for now)
        const q = query(
            collection(db, "orders"),
            where("farmerId", "==", auth.currentUser.uid),
            where("status", "==", "accepted")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const paymentData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore timestamp to Date object
                date: doc.data().createdAt?.toDate()
            }));
            
            // Sort by date (newest first) locally since we can't mix orderBy with where in simple queries easily without index
            paymentData.sort((a, b) => b.date - a.date);

            setPayments(paymentData);
            
            // Calculate total
            const total = paymentData.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
            setTotalEarnings(total);
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const renderPaymentItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="cash-check" size={24} color="#fff" />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.date}>{item.date?.toLocaleDateString()}</Text>
                <Text style={styles.customer}>Customer: {item.customerEmail || "N/A"}</Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={styles.amount}>+₹{item.totalPrice.toFixed(2)}</Text>
                <Text style={styles.status}>Received</Text>
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#2E8B57" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Earnings</Text>
                <Text style={styles.summaryAmount}>₹ {totalEarnings.toFixed(2)}</Text>
            </View>

            <Text style={styles.sectionTitle}>Transaction History</Text>

            <FlatList
                data={payments}
                keyExtractor={item => item.id}
                renderItem={renderPaymentItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No completed payments yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    summaryCard: {
        backgroundColor: '#2E8B57',
        padding: 20,
        margin: 20,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 5,
    },
    summaryLabel: { color: '#e0e0e0', fontSize: 16, marginBottom: 5 },
    summaryAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 10, color: '#333' },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },
    iconContainer: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#2E8B57',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15
    },
    infoContainer: { flex: 1 },
    productName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    date: { fontSize: 12, color: 'gray', marginBottom: 2 },
    customer: { fontSize: 12, color: '#555' },
    amountContainer: { alignItems: 'flex-end' },
    amount: { fontSize: 16, fontWeight: 'bold', color: '#2E8B57' },
    status: { fontSize: 10, color: 'gray' },
    emptyContainer: { alignItems: 'center', marginTop: 30 },
    emptyText: { color: 'gray', fontSize: 16 }
});
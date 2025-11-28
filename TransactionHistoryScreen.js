import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseconfig';

export default function TransactionHistoryScreen() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, "orders"),
            where("customerId", "==", auth.currentUser.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.price}>₹{item.totalPrice}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.date}>
                    {item.createdAt?.toDate().toLocaleDateString() || "Unknown Date"}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'delivered' ? '#e8f5e9' : '#fff3e0' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'delivered' ? '#2e7d32' : '#ef6c00' }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <Text style={styles.quantity}>Qty: {item.quantity} kg</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Transaction History</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#2E8B57" />
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={<Text style={styles.emptyText}>No transactions found.</Text>}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#eee'
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    productName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    price: { fontSize: 18, fontWeight: 'bold', color: '#2E8B57' },
    date: { color: '#888', fontSize: 14 },
    quantity: { color: '#555', fontSize: 14, marginTop: 5 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#888' }
});
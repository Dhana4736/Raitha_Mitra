import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseconfig';

export default function DeliveryStatusScreen() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;

        // Fetch orders that represent "active" deliveries (not cancelled)
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
            setOrders(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getStatusStep = (status) => {
        switch(status) {
            case 'pending': return 1;
            case 'shipped': return 2;
            case 'delivered': return 3;
            default: return 0;
        }
    };

    const renderStatusIndicator = (status) => {
        const step = getStatusStep(status);
        if (status === 'cancelled') return <Text style={{color: 'red', fontWeight: 'bold'}}>Cancelled</Text>;

        return (
            <View style={styles.timeline}>
                <View style={styles.step}>
                    <MaterialCommunityIcons name="package-variant" size={24} color={step >= 1 ? "#2E8B57" : "#ccc"} />
                    <Text style={[styles.stepText, step >= 1 && styles.activeText]}>Ordered</Text>
                </View>
                <View style={[styles.line, { backgroundColor: step >= 2 ? "#2E8B57" : "#ccc" }]} />
                <View style={styles.step}>
                    <MaterialCommunityIcons name="truck-delivery" size={24} color={step >= 2 ? "#2E8B57" : "#ccc"} />
                    <Text style={[styles.stepText, step >= 2 && styles.activeText]}>Shipped</Text>
                </View>
                <View style={[styles.line, { backgroundColor: step >= 3 ? "#2E8B57" : "#ccc" }]} />
                <View style={styles.step}>
                    <MaterialCommunityIcons name="home-outline" size={24} color={step >= 3 ? "#2E8B57" : "#ccc"} />
                    <Text style={[styles.stepText, step >= 3 && styles.activeText]}>Delivered</Text>
                </View>
            </View>
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.orderId}>ID: {item.id.slice(0, 6).toUpperCase()}</Text>
            </View>
            <Text style={styles.details}>{item.quantity} kg • ₹{item.totalPrice}</Text>
            
            <View style={styles.statusContainer}>
                {renderStatusIndicator(item.status)}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Track Delivery</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#2E8B57" />
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={<Text style={styles.emptyText}>No active orders.</Text>}
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
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#eee'
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    productName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    orderId: { fontSize: 12, color: '#888' },
    details: { fontSize: 14, color: '#666', marginBottom: 20 },
    
    // Timeline Styles
    statusContainer: { marginTop: 10 },
    timeline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    step: { alignItems: 'center' },
    line: { flex: 1, height: 2, marginHorizontal: 5, marginTop: -15 },
    stepText: { fontSize: 10, color: '#ccc', marginTop: 5 },
    activeText: { color: '#2E8B57', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#888' }
});
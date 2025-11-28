import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Import path is CORRECT
import { auth, db } from '../firebaseconfig';

const OrderCard = ({ item, onCall, onChat }) => {
    const handleUpdateStatus = async (newStatus) => {
        const orderRef = doc(db, "orders", item.id);
        try {
            await updateDoc(orderRef, { status: newStatus });

            if (newStatus === 'accepted') {
                // --- THE FIX IS HERE ---
                // Changed 'My Orders' to 'MyOrders' to match the screen name in App.js
                await addDoc(collection(db, "notifications"), {
                    userId: item.customerId,
                    message: `Your order for ${item.productName} has been accepted!`,
                    read: false,
                    createdAt: serverTimestamp(),
                    screen: 'MyOrders', // This now correctly matches the name in the Stack Navigator
                    params: { orderId: item.id }
                });
            }
            Alert.alert("Success", `Order has been ${newStatus}.`);
        } catch (error) {
            console.error("Error updating status: ", error);
            Alert.alert("Error", "Could not update the order status.");
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardBody}>
                <View style={styles.cardTextContent}>
                    <Text style={styles.cardTitle}>{item.productName}</Text>
                    <Text style={styles.cardInfo}>Quantity: {item.quantity}</Text>
                    <Text style={styles.cardInfo}>Total: ₹{item.totalPrice.toFixed(2)}</Text>
                    <Text style={styles.cardInfo}>Customer: {item.customerName || item.customerEmail}</Text>
                    <Text style={styles.cardStatus(item.status)}>Status: {item.status}</Text>
                </View>
                {item.productImageUrl && (
                    <Image source={{ uri: item.productImageUrl }} style={styles.productImage} />
                )}
            </View>

            {item.status === 'pending' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={() => handleUpdateStatus('accepted')}>
                        <Octicons name="check" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={() => handleUpdateStatus('declined')}>
                         <Octicons name="x" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            )}

            {item.status === 'accepted' && (
                 <View style={styles.contactButtons}>
                    <TouchableOpacity style={[styles.button, styles.chatButton]} onPress={() => onChat(item.customerId, item.customerName)}>
                        <MaterialCommunityIcons name="message-text-outline" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.callButton]} onPress={() => onCall(item.customerPhone)}>
                        <MaterialCommunityIcons name="phone" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Call Customer</Text>
                    </TouchableOpacity>
                 </View>
            )}
        </View>
    );
};

export default function ViewOrdersScreen() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState({});
    const [products, setProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        // Safety check: Ensure user is logged in
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "orders"),
            where("farmerId", "==", auth.currentUser.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const ordersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setOrders(ordersData);
            
            if (querySnapshot.empty) {
                setLoading(false);
                return;
            }

            try {
                const customerIds = [...new Set(ordersData.map(o => o.customerId))].filter(id => !customers[id]);
                const productIds = [...new Set(ordersData.map(o => o.productId))].filter(id => !products[id]);

                if (customerIds.length > 0) {
                    const customersQuery = query(collection(db, "users"), where("__name__", "in", customerIds));
                    const customerSnapshots = await getDocs(customersQuery);
                    const newCustomersData = {};
                    customerSnapshots.forEach(doc => newCustomersData[doc.id] = doc.data());
                    setCustomers(prev => ({ ...prev, ...newCustomersData }));
                }
                
                if (productIds.length > 0) {
                    const productsQuery = query(collection(db, "products"), where("__name__", "in", productIds));
                    const productSnapshots = await getDocs(productsQuery);
                    const newProductsData = {};
                    productSnapshots.forEach(doc => newProductsData[doc.id] = doc.data());
                    setProducts(prev => ({ ...prev, ...newProductsData }));
                }
            } catch (error) {
                console.error("Error fetching related data: ", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleCall = (phoneNumber) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        } else {
            Alert.alert("No Phone Number", "This customer has not provided a phone number.");
        }
    };

    const handleChat = (customerId, customerName) => {
        navigation.navigate('Chat', { recipientId: customerId, recipientName: customerName });
    };

    const combinedOrders = useMemo(() => {
        return orders.map(order => ({
            ...order,
            customerName: customers[order.customerId]?.name,
            customerPhone: customers[order.customerId]?.phone,
            productImageUrl: products[order.productId]?.imageUrl,
        }));
    }, [orders, customers, products]);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#2E8B57" /></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Incoming Orders</Text>
            </View>
            
            <FlatList
                data={combinedOrders}
                renderItem={({ item }) => <OrderCard item={item} onCall={handleCall} onChat={handleChat} />}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.container}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>You have no pending orders.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    container: { padding: 15 },
    emptyText: { fontSize: 16, color: 'gray' },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        alignItems: 'center',
    },
    cardTextContent: { flex: 1 },
    productImage: { width: 80, height: 80, borderRadius: 10, marginLeft: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    cardInfo: { fontSize: 16, color: '#555', marginBottom: 3 },
    cardStatus: (status) => ({
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        color: status === 'pending' ? '#FFA500' : status === 'accepted' ? '#2E8B57' : '#B22222',
    }),
    actionButtons: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee' },
    contactButtons: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee' },
    button: { flex: 1, flexDirection: 'row', padding: 15, justifyContent: 'center', alignItems: 'center' },
    acceptButton: { backgroundColor: '#2E8B57' },
    declineButton: { backgroundColor: '#B22222' },
    callButton: { backgroundColor: '#1E90FF' },
    chatButton: { backgroundColor: '#FFA500' },
    buttonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
});
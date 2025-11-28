import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseconfig';

const STATUS_OPTIONS = ['pending', 'accepted', 'shipped', 'delivered', 'cancelled'];

// Unified Card Component
const OrderCard = ({ item, isFarmer, onRate, onUpdateStatus }) => {
    
    const getStatusColor = (status) => {
        switch(status) {
            case 'pending': return '#FFA500';
            case 'accepted': return '#32CD32';
            case 'shipped': return '#1E90FF';
            case 'delivered': return '#2E8B57';
            case 'cancelled': return '#FF4500';
            default: return '#333';
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardBody}>
                {item.productImageUrl ? (
                    <Image source={{ uri: item.productImageUrl }} style={styles.productImage} />
                ) : (
                    <View style={styles.productImagePlaceholder} />
                )}
                <View style={styles.cardTextContent}>
                    <Text style={styles.cardTitle}>{item.productName}</Text>
                    <Text style={styles.cardInfo}>Quantity: {item.quantity} kg</Text>
                    <Text style={styles.cardInfo}>Total: ₹{item.totalPrice}</Text>
                    <Text style={styles.cardDate}>
                        {item.createdAt?.toDate().toLocaleDateString()}
                    </Text>
                    
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {item.status.toUpperCase()}
                            </Text>
                        </View>

                        {/* --- FARMER ACTION: Update Status --- */}
                        {isFarmer && (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => onUpdateStatus(item)}>
                                <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                                <Text style={styles.actionBtnText}>Update</Text>
                            </TouchableOpacity>
                        )}

                        {/* --- CUSTOMER ACTION: Rate Order --- */}
                        {!isFarmer && (item.status === 'accepted' || item.status === 'delivered') && (
                            item.isRated ? (
                                <View style={styles.rateIconDisabled}>
                                    <MaterialCommunityIcons name="star" size={20} color="#FFA500" />
                                    <Text style={styles.rateTextDisabled}>Rated</Text>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.rateIcon} onPress={() => onRate(item)}>
                                    <MaterialCommunityIcons name="star-outline" size={20} color="#FFA500" />
                                    <Text style={styles.rateText}>Rate</Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function MyOrdersScreen() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    // Feedback Modal State
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Status Update Modal State (For Farmers)
    const [statusModalVisible, setStatusModalVisible] = useState(false);

    // 1. Fetch User Role & Orders
    useEffect(() => {
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        const fetchUserDataAndOrders = async () => {
            // Fetch User Role
            const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
            const role = userDoc.exists() ? userDoc.data().role : 'Customer';
            setUserRole(role);

            // Define Query based on Role
            const queryField = role === 'Farmer' ? "farmerId" : "customerId";
            
            const q = query(
                collection(db, "orders"),
                where(queryField, "==", auth.currentUser.uid),
                orderBy("createdAt", "desc")
            );

            const unsubscribe = onSnapshot(q, async (querySnapshot) => {
                const ordersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setOrders(ordersData);

                if (ordersData.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch Product Details (Images)
                try {
                    const productIdsToFetch = [...new Set(ordersData.map(o => o.productId))].filter(id => !products[id]);
                    if (productIdsToFetch.length > 0) {
                        const productsQuery = query(collection(db, "products"), where("__name__", "in", productIdsToFetch));
                        const productSnapshots = await getDocs(productsQuery);
                        const newProductsData = {};
                        productSnapshots.forEach(doc => {
                            newProductsData[doc.id] = doc.data();
                        });
                        setProducts(prev => ({ ...prev, ...newProductsData }));
                    }
                } catch (error) {
                    console.error("Error fetching product details:", error);
                } finally {
                    setLoading(false);
                }
            }, (error) => {
                console.log("Orders Listener Error:", error.code);
                setLoading(false);
            });

            return () => unsubscribe();
        };

        fetchUserDataAndOrders();
    }, []);

    const combinedOrders = useMemo(() => {
        return orders.map(order => ({
            ...order,
            productImageUrl: products[order.productId]?.imageUrl,
        }));
    }, [orders, products]);

    // --- CUSTOMER: Feedback Logic ---
    const openFeedbackModal = (order) => {
        setSelectedOrder(order);
        setRating(0);
        setReview('');
        setFeedbackModalVisible(true);
    };

    const submitFeedback = async () => {
        if (rating === 0) {
            Alert.alert("Rating Required", "Please select a star rating.");
            return;
        }
        
        setSubmitting(true);
        try {
            await addDoc(collection(db, "feedbacks"), {
                orderId: selectedOrder.id,
                farmerId: selectedOrder.farmerId,
                customerId: auth.currentUser.uid,
                customerName: auth.currentUser.displayName || "Customer",
                productName: selectedOrder.productName,
                productImageUrl: selectedOrder.productImageUrl,
                rating: rating,
                review: review,
                createdAt: serverTimestamp(),
            });

            const orderRef = doc(db, "orders", selectedOrder.id);
            await updateDoc(orderRef, { isRated: true });
            
            Alert.alert("Thank You!", "Your feedback has been submitted.");
            setFeedbackModalVisible(false);
        } catch (error) {
            console.error("Error submitting feedback:", error);
            Alert.alert("Error", "Could not submit feedback.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- FARMER: Status Update Logic ---
    const openStatusModal = (order) => {
        setSelectedOrder(order);
        setStatusModalVisible(true);
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedOrder) return;
        try {
            await updateDoc(doc(db, "orders", selectedOrder.id), {
                status: newStatus
            });
            
            // Send Notification to Customer
            await addDoc(collection(db, "notifications"), {
                userId: selectedOrder.customerId,
                message: `Your order for ${selectedOrder.productName} is now ${newStatus}.`,
                screen: 'MyOrders',
                read: false,
                createdAt: serverTimestamp(),
            });

            Alert.alert("Success", `Order marked as ${newStatus}`);
            setStatusModalVisible(false);
        } catch (error) {
            Alert.alert("Error", "Failed to update status");
        }
    };

    const renderStars = () => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                    <MaterialCommunityIcons 
                        name={i <= rating ? "star" : "star-outline"} 
                        size={40} 
                        color="#FFA500" 
                    />
                </TouchableOpacity>
            );
        }
        return <View style={styles.starContainer}>{stars}</View>;
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#2E8B57" /></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {userRole === 'Farmer' ? "Incoming Orders" : "My Orders"}
                </Text>
            </View>
            <FlatList
                data={combinedOrders}
                renderItem={({ item }) => (
                    <OrderCard 
                        item={item} 
                        isFarmer={userRole === 'Farmer'}
                        onRate={openFeedbackModal}
                        onUpdateStatus={openStatusModal}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.container}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>No orders found.</Text>
                    </View>
                }
            />

            {/* Customer Feedback Modal */}
            <Modal animationType="slide" transparent={true} visible={feedbackModalVisible} onRequestClose={() => setFeedbackModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Rate Your Order</Text>
                        <Text style={styles.modalSubtitle}>How was the {selectedOrder?.productName}?</Text>
                        {renderStars()}
                        <TextInput
                            style={styles.input}
                            placeholder="Write a review (Optional)"
                            multiline
                            numberOfLines={4}
                            value={review}
                            onChangeText={setReview}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setFeedbackModalVisible(false)}>
                                <Text style={styles.buttonTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={submitFeedback} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextSubmit}>Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Farmer Status Update Modal */}
            <Modal animationType="fade" transparent={true} visible={statusModalVisible} onRequestClose={() => setStatusModalVisible(false)}>
                <Pressable style={styles.modalContainer} onPress={() => setStatusModalVisible(false)}>
                    <Pressable style={styles.modalView}>
                        <Text style={styles.modalTitle}>Update Status</Text>
                        <Text style={styles.modalSubtitle}>Current: {selectedOrder?.status.toUpperCase()}</Text>
                        {STATUS_OPTIONS.map(status => (
                            <TouchableOpacity 
                                key={status} 
                                style={styles.statusOption}
                                onPress={() => handleUpdateStatus(status)}
                            >
                                <Text style={[
                                    styles.statusOptionText, 
                                    selectedOrder?.status === status && {color: '#2E8B57', fontWeight: 'bold'}
                                ]}>
                                    {status.toUpperCase()}
                                </Text>
                                {selectedOrder?.status === status && <Octicons name="check" size={20} color="#2E8B57" />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.closeButton} onPress={() => setStatusModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingVertical: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#2E8B57' },
    container: { padding: 15 },
    emptyText: { fontSize: 16, color: 'gray' },
    
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardBody: { flexDirection: 'row', padding: 15 },
    productImage: { width: 90, height: 90, borderRadius: 10, marginRight: 15, backgroundColor: '#f0f0f0' },
    productImagePlaceholder: { width: 90, height: 90, borderRadius: 10, marginRight: 15, backgroundColor: '#f0f0f0' },
    cardTextContent: { flex: 1, justifyContent: 'space-between' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    cardInfo: { fontSize: 14, color: '#666' },
    cardDate: { fontSize: 12, color: '#999', marginTop: 4, marginBottom: 8 },
    
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    statusText: { fontSize: 12, fontWeight: 'bold' },

    // Action Buttons
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E8B57', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    actionBtnText: { color: '#fff', fontSize: 12, marginLeft: 4, fontWeight: 'bold' },

    rateIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', padding: 5, borderRadius: 5 },
    rateText: { color: '#FFA500', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
    rateIconDisabled: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 5, borderRadius: 5 },
    rateTextDisabled: { color: '#888', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },

    // Modal Styles
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, textAlign: 'center', color: '#333' },
    modalSubtitle: { fontSize: 14, color: 'gray', marginBottom: 20, textAlign: 'center' },
    starContainer: { flexDirection: 'row', marginBottom: 20, justifyContent: 'center', gap: 10 },
    input: { width: '100%', height: 80, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, textAlignVertical: 'top', marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
    modalButtons: { flexDirection: 'row', gap: 15, width: '100%' },
    button: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f0f0f0' },
    submitButton: { backgroundColor: '#2E8B57' },
    buttonTextCancel: { fontWeight: 'bold', color: '#333' },
    buttonTextSubmit: { fontWeight: 'bold', color: '#fff' },

    // Status Options
    statusOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    statusOptionText: { fontSize: 16, color: '#333' },
    closeButton: { marginTop: 15, alignItems: 'center' },
    closeButtonText: { color: '#666', fontSize: 14, fontWeight: 'bold' }
});
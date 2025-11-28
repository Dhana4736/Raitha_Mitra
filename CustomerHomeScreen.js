import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseconfig';
import { translations } from '../constants/translations';

const languageMap = {
    en: 'English',
    kn: 'Kannada',
    te: 'Telugu',
    hi: 'Hindi',
    ta: 'Tamil',
};

const ProductCard = ({ item, onOrder, onCall, onChat, onViewFarmer, t }) => {
    const renderProductRating = (rating) => {
        const stars = [];
        const roundedRating = Math.round(rating) || 0; 
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <MaterialCommunityIcons 
                    key={i} 
                    name={i <= roundedRating ? "star" : "star-outline"} 
                    size={16} 
                    color="#FFA500" 
                />
            );
        }
        return <View style={styles.productRatingContainer}>{stars}<Text style={styles.ratingCountText}>({item.reviewCount || 0})</Text></View>;
    };

    return (
        <View style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            
            {(item.orderCount > 5) && (
                <View style={styles.bestSellerBadge}>
                    <Text style={styles.bestSellerText}>Best Seller</Text>
                </View>
            )}

            <View style={styles.cardHeader}>
                 <View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {renderProductRating(item.averageRating)}
                 </View>
                 <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => onViewFarmer(item.farmerData)}>
                        {item.farmerData?.photoURL ? (
                            <Image source={{ uri: item.farmerData.photoURL }} style={styles.farmerImage} />
                        ) : (
                            <View style={styles.farmerImagePlaceholder}>
                                <Octicons name="person" size={18} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => onChat(item.farmerId, item.farmerName)}>
                        <MaterialCommunityIcons name="chat-processing-outline" size={28} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => onCall(item.farmerData?.phone)}>
                        <MaterialCommunityIcons name="phone-outline" size={28} color="#2E8B57" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardPrice}>₹{item.price.toFixed(2)} / kg</Text>
                <Text style={item.quantity > 0 ? styles.cardQuantity : styles.outOfStockText}>
                    {item.quantity > 0 ? `${t.available}: ${item.quantity} kg` : t.outOfStock}
                </Text>
            </View>
            {item.quantity > 0 ? (
                <TouchableOpacity 
                    style={styles.orderButton} 
                    onPress={() => onOrder(item)}
                >
                    <Text style={styles.orderButtonText}>{t.placeOrder}</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.outOfStockBanner}>
                    <Text style={styles.outOfStockBannerText}>{t.outOfStock}</Text>
                </View>
            )}
        </View>
    );
};

export default function CustomerHomeScreen({ userData }) {
    const navigation = useNavigation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [orderQuantity, setOrderQuantity] = useState('');
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [farmerModalVisible, setFarmerModalVisible] = useState(false);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const langCode = userData?.preferredLanguage || 'en';
    const t = translations[langCode] || translations.en;

    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const productsPromises = querySnapshot.docs.map(async (productDoc) => {
                const productData = { ...productDoc.data(), id: productDoc.id };
                
                // 1. Fetch Farmer Data
                let farmerData = null;
                let farmerName = "Farmer";
                try {
                    const farmerDoc = await getDoc(doc(db, "users", productData.farmerId));
                    if (farmerDoc.exists()) {
                        farmerData = farmerDoc.data();
                        farmerName = farmerData.name;
                    }
                } catch (e) {
                    // console.warn("Error fetching farmer data", e);
                }

                // 2. Fetch Feedbacks
                let averageRating = 0;
                let reviewCount = 0;
                try {
                    const feedbackQuery = query(
                        collection(db, "feedbacks"), 
                        where("farmerId", "==", productData.farmerId),
                        where("productName", "==", productData.name)
                    );
                    const feedbackSnapshot = await getDocs(feedbackQuery);
                    
                    if (!feedbackSnapshot.empty) {
                        const totalRating = feedbackSnapshot.docs.reduce((sum, doc) => sum + (doc.data().rating || 0), 0);
                        reviewCount = feedbackSnapshot.size;
                        averageRating = totalRating / reviewCount;
                    }
                } catch(e) {
                    // console.warn("Error calculating rating", e);
                }

                let orderCount = productData.orderCount || 0; 

                return { 
                    ...productData, 
                    farmerData,
                    farmerName,
                    averageRating,
                    reviewCount,
                    orderCount
                };
            });

            const productsData = await Promise.all(productsPromises);
            setProducts(productsData);
            setLoading(false);
        }, (error) => {
            console.log("Products Listener Error (Ignore if logged out):", error.code);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(
            collection(db, "notifications"), 
            where("userId", "==", auth.currentUser.uid), 
            where("read", "==", false)
        );
        const unsubscribe = onSnapshot(q, 
            (querySnapshot) => setUnreadNotifications(querySnapshot.size),
            (error) => console.log("Notifications Listener Error:", error.code)
        );
        return () => unsubscribe();
    }, [auth.currentUser]); 

    const handleCall = (phoneNumber) => {
        if (phoneNumber) Linking.openURL(`tel:${phoneNumber}`);
        else Alert.alert("No Phone Number", "This farmer has not provided a phone number.");
    };

    const handleChat = (farmerId, farmerName) => {
        navigation.navigate('Chat', { recipientId: farmerId, recipientName: farmerName });
    };

    const handleOrderPress = (product) => {
        setSelectedProduct(product);
        setOrderModalVisible(true);
        setOrderQuantity(''); 
        setIsPlacingOrder(false); 
    };

    const handleViewFarmer = (farmerData) => {
        if (farmerData) {
            setSelectedFarmer(farmerData);
            setFarmerModalVisible(true);
        } else {
            Alert.alert("Farmer details not available.");
        }
    };

    const handlePlaceOrder = async () => {
        if (isPlacingOrder) return; 
        if (!auth.currentUser) {
            return Alert.alert("Error", "You must be logged in to place an order.");
        }

        const requestedQuantity = parseInt(orderQuantity, 10);
        if (!requestedQuantity || requestedQuantity <= 0) {
            return Alert.alert("Invalid Quantity", "Please enter a valid positive number for the quantity.");
        }
        if (requestedQuantity > selectedProduct.quantity) {
            return Alert.alert("Quantity Unavailable", `Sorry, only ${selectedProduct.quantity} kg are available.`);
        }

        setIsPlacingOrder(true); 

        try {
            const totalPrice = selectedProduct.price * requestedQuantity;

            const orderDocRef = await addDoc(collection(db, "orders"), {
                customerId: auth.currentUser.uid,
                customerEmail: auth.currentUser.email || "",
                farmerId: selectedProduct.farmerId,
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                quantity: requestedQuantity,
                totalPrice: totalPrice,
                status: "pending",
                createdAt: serverTimestamp(),
            });

            await addDoc(collection(db, "notifications"), {
                userId: selectedProduct.farmerId,
                message: `You have a new order for ${selectedProduct.name} from ${userData?.name || 'a customer'}.`,
                screen: 'Orders',
                params: { orderId: orderDocRef.id },
                read: false,
                createdAt: serverTimestamp(),
            });

            Alert.alert("Success", "Your order has been placed!");
            setOrderModalVisible(false);

        } catch (error) {
            console.error("Error placing order: ", error);
            Alert.alert("Order Failed", "There was a problem placing your order.");
        } finally {
            setIsPlacingOrder(false); 
        }
    };
    
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t.marketplace}</Text>
                <View style={styles.headerIcons}>
                    {/* --- HEADER NAV ICONS --- */}
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('DeliveryStatus')}>
                        <MaterialCommunityIcons name="truck-delivery-outline" size={24} color="#333" />
                    </TouchableOpacity>

                    {/* Updated: Use 'history' icon for Transaction History */}
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('TransactionHistory')}>
                        <MaterialCommunityIcons name="history" size={24} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
                        <Octicons name="bell" size={24} color="#333" />
                        {unreadNotifications > 0 && (
                            <View style={styles.badge}><Text style={styles.badgeText}>{unreadNotifications}</Text></View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('My Profile')}>
                        {userData?.photoURL ? (
                            <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profilePlaceholder}><Octicons name="person" size={24} color="#fff" /></View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.container}>
                <View style={styles.searchContainer}>
                    <Octicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput 
                        placeholder={t.searchPlaceholder} 
                        style={styles.searchInput} 
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2E8B57" />
                ) : (
                    <FlatList
                        data={filteredProducts}
                        renderItem={({ item }) => <ProductCard item={item} onOrder={handleOrderPress} onCall={handleCall} onChat={handleChat} onViewFarmer={handleViewFarmer} t={t} />}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={<Text style={styles.sectionTitle}>{t.featuredProducts}</Text>}
                        ListEmptyComponent={<View style={styles.emptyContainer}><Text>No products found.</Text></View>}
                        contentContainerStyle={{ paddingBottom: 80 }}
                    />
                )}
            </View>

            <Modal animationType="slide" transparent={true} visible={orderModalVisible} onRequestClose={() => setOrderModalVisible(false)}>
                <Pressable style={styles.modalContainer} onPress={() => setOrderModalVisible(false)}>
                    <Pressable>
                        <View style={styles.modalView}>
                            <Text style={styles.modalTitle}>{t.placeOrder} for {selectedProduct?.name}</Text>
                            <TextInput style={styles.modalInput} placeholder="Enter quantity (e.g., 5 kg)" keyboardType="numeric" value={orderQuantity} onChangeText={setOrderQuantity} />
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setOrderModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.confirmButton, isPlacingOrder && styles.disabledOrderButton]} 
                                    onPress={handlePlaceOrder}
                                    disabled={isPlacingOrder}
                                >
                                    {isPlacingOrder ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>{t.confirm}</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={farmerModalVisible}
                onRequestClose={() => setFarmerModalVisible(false)}
            >
                <Pressable style={styles.modalContainer} onPress={() => setFarmerModalVisible(false)}>
                    <Pressable>
                        <View style={styles.farmerModalView}>
                            <Image source={{ uri: selectedFarmer?.photoURL }} style={styles.farmerModalImage} />
                            <Text style={styles.farmerModalName}>{selectedFarmer?.name}</Text>
                            <Text style={styles.farmerModalRole}>{selectedFarmer?.role}</Text>
                            <View style={styles.farmerModalInfoRow}>
                                <Octicons name="device-mobile" size={20} color="#555" />
                                <Text style={styles.farmerModalInfoText}>{selectedFarmer?.phone || 'Not provided'}</Text>
                            </View>
                             <View style={styles.farmerModalInfoRow}>
                                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#555" />
                                <Text style={styles.farmerModalInfoText}>{selectedFarmer?.address || 'Not provided'}</Text>
                            </View>
                            <View style={styles.farmerModalInfoRow}>
                                 <MaterialCommunityIcons name="translate" size={20} color="#555" />
                                <Text style={styles.farmerModalInfoText}>Speaks {languageMap[selectedFarmer?.preferredLanguage] || 'English'}</Text>
                            </View>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton, { marginTop: 20 }]} 
                                onPress={() => setFarmerModalVisible(false)}
                            >
                                <Text style={styles.confirmButtonText}>{t.close}</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F0FFF0' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E8B57' },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { marginRight: 15, position: 'relative' },
    badge: { position: 'absolute', right: -6, top: -3, backgroundColor: 'red', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    profileImage: { width: 35, height: 35, borderRadius: 17.5 },
    profilePlaceholder: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, elevation: 2 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: 50, fontSize: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    card: { backgroundColor: 'white', borderRadius: 10, overflow: 'hidden', marginBottom: 15, elevation: 3, position: 'relative' },
    cardImage: { width: '100%', height: 150 },
    bestSellerBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        zIndex: 10,
        elevation: 5,
    },
    bestSellerText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 15, paddingTop: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginRight: 10 },
    productRatingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    ratingCountText: { fontSize: 12, color: 'gray', marginLeft: 5 },
    cardActions: { flexDirection: 'row', alignItems: 'center' },
    farmerImage: { width: 32, height: 32, borderRadius: 16 },
    farmerImagePlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
    cardContent: { paddingHorizontal: 15, paddingBottom: 15, paddingTop: 5 },
    cardPrice: { fontSize: 16, color: '#2E8B57', marginVertical: 5 },
    cardQuantity: { fontSize: 14, color: 'gray' },
    outOfStockText: { fontSize: 14, color: 'red', fontWeight: 'bold' },
    orderButton: { backgroundColor: '#2E8B57', paddingVertical: 12, alignItems: 'center' },
    disabledOrderButton: { backgroundColor: '#A9A9A9' },
    orderButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    outOfStockBanner: {
        backgroundColor: '#B22222',
        paddingVertical: 12,
        alignItems: 'center',
    },
    outOfStockBannerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    
    // Footer removed

    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalView: { width: '85%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center', elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalInput: { width: '100%', height: 50, backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, fontSize: 16 },
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    modalButton: { borderRadius: 10, paddingVertical: 12, elevation: 2, flex: 1, marginHorizontal: 5, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f0f0f0' },
    confirmButton: { backgroundColor: '#2E8B57' },
    cancelButtonText: { color: '#333', fontWeight: 'bold' },
    confirmButtonText: { color: 'white', fontWeight: 'bold' },
    farmerModalView: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
    farmerModalImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#2E8B57', marginBottom: 15 },
    farmerModalName: { fontSize: 22, fontWeight: 'bold' },
    farmerModalRole: { fontSize: 16, color: 'gray', textTransform: 'capitalize', marginBottom: 20 },
    farmerModalInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '100%' },
    farmerModalInfoText: { fontSize: 16, color: '#333', marginLeft: 15, flex: 1 },
});
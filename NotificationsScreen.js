import { useNavigation } from '@react-navigation/native';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Import path is CORRECT here
import { auth, db } from '../firebaseconfig';

// A component to render each notification
const NotificationItem = ({ item }) => {
    const navigation = useNavigation();

    // This function handles the press event
    const handlePress = () => {
        console.log("Notification pressed. Data:", JSON.stringify(item, null, 2));

        // Mark the notification as read when it's pressed
        if (!item.read) {
            updateDoc(doc(db, "notifications", item.id), { read: true });
        }
        
        // Navigate to the specified screen with params, if they exist
        if (item.screen) {
            try {
                console.log(`Attempting to navigate to screen: "${item.screen}" with params:`, item.params || {});
                navigation.navigate(item.screen, item.params || {});
            } catch (error) {
                console.error("Navigation failed:", error);
                Alert.alert("Navigation Error", `Could not navigate to the screen: ${item.screen}. Please check your navigator setup in App.js.`);
            }
        } else {
            console.log("No screen specified in notification data.");
        }
    };

    return (
        <TouchableOpacity onPress={handlePress}>
            <View style={[styles.card, !item.read && styles.unreadCard]}>
                <Text style={styles.cardText}>{item.message}</Text>
                <Text style={styles.cardDate}>
                    {item.createdAt?.toDate().toLocaleString()}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety check: Ensure user is logged in
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", auth.currentUser.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notifsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setNotifications(notifsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#2E8B57" /></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={notifications}
                renderItem={({ item }) => <NotificationItem item={item} />}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.container}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Notifications</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.emptyText}>You have no notifications.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingBottom: 10 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    container: { padding: 15 },
    emptyText: { fontSize: 16, color: 'gray' },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 1,
    },
    unreadCard: {
        backgroundColor: '#E8F5E9',
        borderLeftWidth: 4,
        borderLeftColor: '#2E8B57',
    },
    cardText: { fontSize: 16, marginBottom: 5 },
    cardDate: { fontSize: 12, color: 'gray', textAlign: 'right' },
});
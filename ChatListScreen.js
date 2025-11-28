import { Octicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// This import path is CORRECT
import { auth, db } from '../firebaseconfig';

export default function ChatListScreen() {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        // Safety check: Ensure user is logged in
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        // This is the new, efficient query using an array.
        const q = query(collection(db, "chats"), where("participantIds", "array-contains", auth.currentUser.uid));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const chatsPromises = querySnapshot.docs.map(async (d) => {
                const chatData = d.data();
                // Find the ID of the *other* person in the chat
                const otherParticipantId = chatData.participantIds.find(id => id !== auth.currentUser.uid);
                
                if (otherParticipantId) {
                    const userDoc = await getDoc(doc(db, "users", otherParticipantId));
                    return {
                        id: d.id,
                        ...chatData,
                        otherUserName: userDoc.exists() ? userDoc.data().name : "User",
                        otherUserPhoto: userDoc.exists() ? userDoc.data().photoURL : null,
                        recipientId: otherParticipantId,
                    };
                }
                return null;
            });
            const chatsData = (await Promise.all(chatsPromises)).filter(Boolean);
            setChats(chatsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#2E8B57" /></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Chats</Text>
            </View>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.chatItem} 
                        onPress={() => navigation.navigate('Chat', { chatId: item.id, recipientId: item.recipientId, recipientName: item.otherUserName })}
                    >
                        {item.otherUserPhoto ? (
                            <Image source={{ uri: item.otherUserPhoto }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profilePlaceholder}>
                                <Octicons name="person" size={24} color="#fff" />
                            </View>
                        )}
                        <View style={styles.chatInfo}>
                            <Text style={styles.userName}>{item.otherUserName}</Text>
                            <Text style={styles.lastMessage} numberOfLines={1}>
                                {item.lastMessage?.text || "No messages yet."}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>You have no active chats.</Text></View>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    chatItem: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    profilePlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    chatInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: 'bold' },
    lastMessage: { fontSize: 14, color: 'gray', marginTop: 4 },
    emptyText: { fontSize: 16, color: 'gray' },
});
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Import path is CORRECT
import { auth } from '../firebaseconfig';

export default function ProfileScreen({ route }) {
    const navigation = useNavigation();
    // Safely access userData, defaulting to null if route.params is undefined
    const userData = route.params?.userData || null;

    const handleSignOut = () => {
        signOut(auth).catch(error => Alert.alert("Sign Out Error", error.message));
    };

    const navigateToEdit = () => {
        navigation.navigate('EditProfile', { isEditing: true });
    };

    // If userData is missing (e.g., direct navigation or error), show a loading state or fallback
    if (!userData) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.centered]}>
                <ActivityIndicator size="large" color="#2E8B57" />
                <Text>Loading Profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.profileHeader}>
                    <Image
                        source={userData?.photoURL ? { uri: userData.photoURL } : require('../assets/splash-icon.png')}
                        style={styles.profileImage}
                    />
                    <Text style={styles.profileName}>{userData?.name || "User"}</Text>
                    <Text style={styles.profileRole}>{userData?.role}</Text>
                </View>

                <View style={styles.infoSection}>
                    {/* Email for Customer, optional for Farmer */}
                    {(userData?.email) && (
                         <View style={styles.infoRow}>
                            <Octicons name="mail" size={24} color="#555" />
                            <Text style={styles.infoText}>{userData.email}</Text>
                        </View>
                    )}
                   
                    {/* Phone for both */}
                    {userData?.phone && (
                         <View style={styles.infoRow}>
                            <Octicons name="device-mobile" size={24} color="#555" />
                            <Text style={styles.infoText}>+91 {userData.phone}</Text>
                        </View>
                    )}

                    {/* Aadhaar for Farmer */}
                    {userData?.role === 'Farmer' && userData?.aadhaar && (
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#555" />
                            <Text style={styles.infoText}>Aadhaar: **** **** {userData.aadhaar.slice(-4)}</Text>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={24} color="#555" />
                        <Text style={styles.infoText}>{userData?.address || "No address set"}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.editButton} onPress={navigateToEdit}>
                    <Octicons name="pencil" size={20} color="#fff" />
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <MaterialCommunityIcons name="logout" size={24} color="#B22222" />
                    <Text style={styles.signOutButtonText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, // Added for loading state
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    container: { padding: 20 },
    profileHeader: { alignItems: 'center', marginBottom: 30 },
    profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#2E8B57', marginBottom: 15 },
    profileName: { fontSize: 26, fontWeight: 'bold' },
    profileRole: { fontSize: 16, color: 'gray', textTransform: 'capitalize' },
    infoSection: { backgroundColor: '#fff', borderRadius: 10, padding: 20, marginBottom: 30 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    infoText: { fontSize: 16, marginLeft: 15, flex: 1, color: '#333' },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2E8B57',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    editButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#B22222',
    },
    signOutButtonText: { color: '#B22222', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});
import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image } from 'react-native';
// --- FIX: Import from '../firebaseconfig', NOT '../firebase' ---
import { auth } from '../firebaseconfig';
import { signOut } from 'firebase/auth';
import { Octicons } from '@expo/vector-icons';

export default function HomeScreen({ route }) { // 'route' prop is used to access passed parameters
    
    // Get the photoUri from the navigation parameters.
    // We add a fallback to a placeholder if it's somehow not available.
    const { photoUri } = route.params || { photoUri: null };

    const handleSignOut = () => {
        signOut(auth).catch(error => alert(error.message));
        // The listener in App.js will handle navigation back to the login flow
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* --- Header Section --- */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Home</Text>
                {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.profileImage} />
                ) : (
                    <View style={styles.profilePlaceholder}>
                        <Octicons name="person" size={24} color="#fff" />
                    </View>
                )}
            </View>

            {/* --- Main Content --- */}
            <View style={styles.container}>
                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>You are successfully logged in.</Text>
                <Text style={styles.info}>User ID: {auth.currentUser?.uid}</Text>

                <TouchableOpacity style={styles.button} onPress={handleSignOut}>
                    <Text style={styles.buttonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    profilePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: 'gray',
        marginBottom: 20,
    },
    info: {
        fontSize: 14,
        color: '#333',
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    button: {
        width: '80%',
        padding: 15,
        backgroundColor: '#B22222', // A red color for sign out
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});